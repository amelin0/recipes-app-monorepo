import { Injectable } from '@nestjs/common';
import { and, eq, gte, lte, sql } from 'drizzle-orm';

import { ShoppingItemOrigin } from '@dns/shared-types';

import {
    mealPlanItems,
    recipeIngredients,
    shoppingListItems,
    shoppingListMarks,
    shoppingListSettings,
} from '../../schema';
import { BaseRepository } from '../base.repository';

export interface StoredItem {
    productId: string;
    amountG: number;
}

export interface Mark {
    productId: string;
    origin: ShoppingItemOrigin;
}

@Injectable()
export class ShoppingListRepository extends BaseRepository {
    async findItems(userId: string): Promise<StoredItem[]> {
        const rows = await this.db
            .select({ productId: shoppingListItems.productId, amountG: shoppingListItems.amountG })
            .from(shoppingListItems)
            .where(eq(shoppingListItems.userId, userId));

        return rows.map(row => ({ productId: row.productId, amountG: Number(row.amountG) }));
    }

    /**
     * What the planned dishes add up to, per product.
     *
     * Summed in the database rather than assembled in memory: a week of plans
     * is a few hundred ingredient rows, and pulling them back only to add them
     * up would be the same work done twice.
     */
    async planTotals(userId: string, from: string, to: string): Promise<StoredItem[]> {
        const rows = await this.db
            .select({
                productId: recipeIngredients.productId,
                amountG: sql<string>`sum(${recipeIngredients.amountG})`,
            })
            .from(mealPlanItems)
            .innerJoin(recipeIngredients, eq(recipeIngredients.recipeId, mealPlanItems.recipeId))
            .where(
                and(
                    eq(mealPlanItems.userId, userId),
                    gte(mealPlanItems.planDate, from),
                    lte(mealPlanItems.planDate, to),
                ),
            )
            .groupBy(recipeIngredients.productId);

        return rows.map(row => ({ productId: row.productId, amountG: Number(row.amountG) }));
    }

    async findMarks(userId: string): Promise<Mark[]> {
        const rows = await this.db
            .select({ productId: shoppingListMarks.productId, origin: shoppingListMarks.origin })
            .from(shoppingListMarks)
            .where(eq(shoppingListMarks.userId, userId));

        return rows.map(row => ({ productId: row.productId, origin: row.origin as ShoppingItemOrigin }));
    }

    /**
     * Adds to the list, or to what is already on it.
     *
     * The conflict clause is the merge (add-product FR-009): a second helping
     * of the same product raises the amount rather than making a second line,
     * and the tick comes off because there is more to buy than there was.
     */
    async addItem(userId: string, productId: string, amountG: number): Promise<void> {
        await this.db.transaction(async tx => {
            await tx
                .insert(shoppingListItems)
                .values({ userId, productId, amountG: amountG.toFixed(2) })
                .onConflictDoUpdate({
                    target: [shoppingListItems.userId, shoppingListItems.productId],
                    set: {
                        amountG: sql`${shoppingListItems.amountG} + ${amountG.toFixed(2)}`,
                        updatedAt: new Date(),
                    },
                });

            await tx
                .delete(shoppingListMarks)
                .where(
                    and(
                        eq(shoppingListMarks.userId, userId),
                        eq(shoppingListMarks.productId, productId),
                        eq(shoppingListMarks.origin, ShoppingItemOrigin.Manual),
                    ),
                );
        });
    }

    async removeItem(userId: string, productId: string): Promise<boolean> {
        const deleted = await this.db
            .delete(shoppingListItems)
            .where(and(eq(shoppingListItems.userId, userId), eq(shoppingListItems.productId, productId)))
            .returning({ productId: shoppingListItems.productId });

        if (deleted.length === 0) return false;

        await this.db
            .delete(shoppingListMarks)
            .where(
                and(
                    eq(shoppingListMarks.userId, userId),
                    eq(shoppingListMarks.productId, productId),
                    eq(shoppingListMarks.origin, ShoppingItemOrigin.Manual),
                ),
            );

        return true;
    }

    /** Idempotent: ticking a ticked box is a no-op, not a conflict. */
    async mark(userId: string, productId: string, origin: ShoppingItemOrigin): Promise<void> {
        await this.db.insert(shoppingListMarks).values({ userId, productId, origin }).onConflictDoNothing();
    }

    async unmark(userId: string, productId: string, origin: ShoppingItemOrigin): Promise<void> {
        await this.db
            .delete(shoppingListMarks)
            .where(
                and(
                    eq(shoppingListMarks.userId, userId),
                    eq(shoppingListMarks.productId, productId),
                    eq(shoppingListMarks.origin, origin),
                ),
            );
    }

    /** Empties what the user owns. The plan is untouched — the list is not where dishes live. */
    async clear(userId: string): Promise<void> {
        await this.db.transaction(async tx => {
            await tx.delete(shoppingListItems).where(eq(shoppingListItems.userId, userId));
            await tx.delete(shoppingListMarks).where(eq(shoppingListMarks.userId, userId));
        });
    }

    /** Absent means on: the switch defaults to imported, so a fresh account needs no row. */
    async importFromPlan(userId: string): Promise<boolean> {
        const row = await this.db.query.shoppingListSettings.findFirst({
            where: eq(shoppingListSettings.userId, userId),
        });

        return row?.importFromPlan ?? true;
    }

    async setImportFromPlan(userId: string, importFromPlan: boolean): Promise<void> {
        await this.db
            .insert(shoppingListSettings)
            .values({ userId, importFromPlan })
            .onConflictDoUpdate({
                target: shoppingListSettings.userId,
                set: { importFromPlan, updatedAt: new Date() },
            });
    }
}

/*
 * There is deliberately no sweep of marks whose line has left the list. A tick
 * on an imported product must survive the switch being turned off and on again
 * (weekly-list FR-005), and the plan changing is the same situation from the
 * list's point of view. What is left behind is a row per product per account,
 * and the explicit clear removes it.
 */
