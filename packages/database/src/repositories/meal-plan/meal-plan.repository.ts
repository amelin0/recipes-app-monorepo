import { Injectable } from '@nestjs/common';
import { and, asc, eq, gte, inArray, lte, sql } from 'drizzle-orm';

import { MealSlot } from '@dns/shared-types';

import { MealPlanItemEntity } from '../../entities';
import { mealPlanItems } from '../../schema';
import { BaseRepository, DrizzleDB } from '../base.repository';

type Transaction = Parameters<Parameters<DrizzleDB['transaction']>[0]>[0];

@Injectable()
export class MealPlanRepository extends BaseRepository {
    /** Every item in the window, ordered so a day assembles without sorting again. */
    async findRange(userId: string, from: string, to: string): Promise<MealPlanItemEntity[]> {
        const rows = await this.db.query.mealPlanItems.findMany({
            where: and(
                eq(mealPlanItems.userId, userId),
                gte(mealPlanItems.planDate, from),
                lte(mealPlanItems.planDate, to),
            ),
            orderBy: [asc(mealPlanItems.planDate), asc(mealPlanItems.sortOrder), asc(mealPlanItems.createdAt)],
        });

        return rows.map(MealPlanItemEntity.from);
    }

    /**
     * Appends the dish to its slot.
     *
     * Under the plan lock, so the position it takes is really the next one. A
     * `max() + 1` subquery on its own does not give that: under READ COMMITTED
     * two inserts in flight each read the max from a snapshot without the
     * other's row and both claim the same position. With the lock, the second
     * insert starts only after the first commits and reads it.
     */
    async add(userId: string, planDate: string, slot: MealSlot, recipeId: string): Promise<MealPlanItemEntity> {
        return this.db.transaction(async tx => {
            await lockPlan(tx, userId);

            const [row] = await tx
                .insert(mealPlanItems)
                .values({
                    userId,
                    planDate,
                    slot,
                    recipeId,
                    sortOrder: sql`coalesce((select max(${mealPlanItems.sortOrder}) + 1 from ${mealPlanItems}
                        where ${mealPlanItems.userId} = ${userId}
                          and ${mealPlanItems.planDate} = ${planDate}
                          and ${mealPlanItems.slot} = ${slot}), 0)`,
                })
                .returning();

            if (!row) throw new Error('Failed to insert meal plan item');
            return MealPlanItemEntity.from(row);
        });
    }

    /**
     * Scoped by owner as well as id, so one account cannot edit another's plan.
     *
     * No plan lock: one statement that reads nothing it then writes, and
     * whichever order it lands in against a copy or an add, the result is one
     * those two would also have produced run one after the other.
     */
    async removeItem(userId: string, id: string): Promise<boolean> {
        const deleted = await this.db
            .delete(mealPlanItems)
            .where(and(eq(mealPlanItems.id, id), eq(mealPlanItems.userId, userId)))
            .returning({ id: mealPlanItems.id });

        return deleted.length > 0;
    }

    /** No plan lock, for the same reason as `removeItem`: a single statement with no read behind it. */
    async clearDay(userId: string, planDate: string): Promise<void> {
        await this.db
            .delete(mealPlanItems)
            .where(and(eq(mealPlanItems.userId, userId), eq(mealPlanItems.planDate, planDate)));
    }

    /**
     * Makes each target day a copy of the source day. False, and nothing
     * touched, when the source has nothing to copy.
     *
     * **Replaces rather than appends.** «Copy» means the target ends up like
     * the source; appending onto an already-planned day would silently double
     * its calories, and there is no undo on the sheet that triggers this.
     *
     * **Under the plan lock, and the source read inside it.** A transaction
     * alone is not enough on READ COMMITTED: in a double submit, the second
     * copy's DELETE runs on a snapshot that cannot see the first copy's fresh
     * rows, so it deletes nothing, inserts its own set, and the target ends up
     * with the source twice. Holding the lock first means the second copy
     * starts after the first commits and sees — and replaces — its rows.
     *
     * The emptiness check lives here too, not in the service: a source read
     * before the lock could empty out in the meantime, and the copy would then
     * clear every target — the destructive act the check exists to refuse.
     *
     * Positions are renumbered within each slot in the order the source
     * renders, so the copy reads the same even when the source carries tied
     * positions from before `add` took the lock.
     */
    async copyDay(userId: string, sourceDate: string, targetDates: string[]): Promise<boolean> {
        return this.db.transaction(async tx => {
            await lockPlan(tx, userId);

            const source = await tx
                .select({ slot: mealPlanItems.slot, recipeId: mealPlanItems.recipeId })
                .from(mealPlanItems)
                .where(and(eq(mealPlanItems.userId, userId), eq(mealPlanItems.planDate, sourceDate)))
                .orderBy(asc(mealPlanItems.sortOrder), asc(mealPlanItems.createdAt), asc(mealPlanItems.id));

            if (source.length === 0) return false;

            const targets = [...new Set(targetDates)];

            await tx
                .delete(mealPlanItems)
                .where(and(eq(mealPlanItems.userId, userId), inArray(mealPlanItems.planDate, targets)));

            const positions = new Map<MealSlot, number>();
            const copied = source.map(item => {
                const sortOrder = positions.get(item.slot) ?? 0;
                positions.set(item.slot, sortOrder + 1);
                return { slot: item.slot, recipeId: item.recipeId, sortOrder };
            });

            await tx
                .insert(mealPlanItems)
                .values(targets.flatMap(planDate => copied.map(item => ({ userId, planDate, ...item }))));

            return true;
        });
    }
}

/**
 * Serialises every read-then-write on one account's plan.
 *
 * A transaction-scoped advisory lock rather than a row lock: there is no row
 * that stands for «the plan» — a day with nothing planned has no rows to lock,
 * and that is exactly the day a copy targets. Keyed on the user and namespaced
 * with `meal-plan:`, so it cannot collide with a lock another domain takes on
 * the same user id; a hash collision between two users only makes one of them
 * wait a few milliseconds, never produces a wrong plan. Released on commit or
 * rollback, so an error cannot leak it.
 */
async function lockPlan(tx: Transaction, userId: string): Promise<void> {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`meal-plan:${userId}`}))`);
}
