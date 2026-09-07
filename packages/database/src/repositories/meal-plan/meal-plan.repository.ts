import { Injectable } from '@nestjs/common';
import { and, asc, eq, gte, inArray, lte, sql } from 'drizzle-orm';

import { MealSlot } from '@dns/shared-types';

import { MealPlanItemEntity } from '../../entities';
import { mealPlanItems } from '../../schema';
import { BaseRepository } from '../base.repository';

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

    async add(userId: string, planDate: string, slot: MealSlot, recipeId: string): Promise<MealPlanItemEntity> {
        // Appended to its slot. Read and written in one statement so two taps
        // in flight cannot both claim the same position.
        const [row] = await this.db
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
    }

    /** Scoped by owner as well as id, so one account cannot edit another's plan. */
    async removeItem(userId: string, id: string): Promise<boolean> {
        const deleted = await this.db
            .delete(mealPlanItems)
            .where(and(eq(mealPlanItems.id, id), eq(mealPlanItems.userId, userId)))
            .returning({ id: mealPlanItems.id });

        return deleted.length > 0;
    }

    async clearDay(userId: string, planDate: string): Promise<void> {
        await this.db
            .delete(mealPlanItems)
            .where(and(eq(mealPlanItems.userId, userId), eq(mealPlanItems.planDate, planDate)));
    }

    /**
     * Makes each target day a copy of the source day.
     *
     * **Replaces rather than appends.** «Copy» means the target ends up like
     * the source; appending onto an already-planned day would silently double
     * its calories, and there is no undo on the sheet that triggers this.
     *
     * One transaction, so a target day is never left cleared but unfilled.
     */
    async copyDay(userId: string, sourceDate: string, targetDates: string[]): Promise<void> {
        const source = await this.findRange(userId, sourceDate, sourceDate);

        await this.db.transaction(async tx => {
            await tx
                .delete(mealPlanItems)
                .where(and(eq(mealPlanItems.userId, userId), inArray(mealPlanItems.planDate, targetDates)));

            if (source.length === 0) return;

            await tx.insert(mealPlanItems).values(
                targetDates.flatMap(planDate =>
                    source.map(item => ({
                        userId,
                        planDate,
                        slot: item.slot,
                        recipeId: item.recipeId,
                        sortOrder: item.sortOrder,
                    })),
                ),
            );
        });
    }
}
