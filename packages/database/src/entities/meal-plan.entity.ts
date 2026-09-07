import { MealSlot } from '@dns/shared-types';

import { mealPlanItems } from '../schema';

type MealPlanItemRow = typeof mealPlanItems.$inferSelect;

export class MealPlanItemEntity {
    readonly id: string;
    readonly userId: string;
    readonly planDate: string;
    readonly slot: MealSlot;
    readonly recipeId: string;
    readonly sortOrder: number;

    private constructor(row: MealPlanItemRow) {
        this.id = row.id;
        this.userId = row.userId;
        this.planDate = row.planDate;
        this.slot = row.slot as MealSlot;
        this.recipeId = row.recipeId;
        this.sortOrder = row.sortOrder;
    }

    static from(row: MealPlanItemRow): MealPlanItemEntity {
        return new MealPlanItemEntity(row);
    }
}
