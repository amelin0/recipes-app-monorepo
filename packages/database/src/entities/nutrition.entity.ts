import { MealSlot } from '@dns/shared-types';

import { dailySteps, mealLogEntries, nutritionGoals, waterLogEntries } from '../schema';

type NutritionGoalRow = typeof nutritionGoals.$inferSelect;
type MealLogEntryRow = typeof mealLogEntries.$inferSelect;
type WaterLogEntryRow = typeof waterLogEntries.$inferSelect;
type DailyStepsRow = typeof dailySteps.$inferSelect;

export class NutritionGoalEntity {
    readonly userId: string;
    readonly dailyCalories: number;
    readonly dailyProteinG: number;
    readonly dailyFatsG: number;
    readonly dailyCarbsG: number;
    readonly dailyWaterMl: number;
    readonly dailyFiberG: number;
    readonly dailyStepsTarget: number;
    readonly updatedAt: Date;

    private constructor(row: NutritionGoalRow) {
        this.userId = row.userId;
        this.dailyCalories = row.dailyCalories;
        this.dailyProteinG = row.dailyProteinG;
        this.dailyFatsG = row.dailyFatsG;
        this.dailyCarbsG = row.dailyCarbsG;
        this.dailyWaterMl = row.dailyWaterMl;
        this.dailyFiberG = row.dailyFiberG;
        this.dailyStepsTarget = row.dailyStepsTarget;
        this.updatedAt = row.updatedAt;
    }

    static from(row: NutritionGoalRow): NutritionGoalEntity {
        return new NutritionGoalEntity(row);
    }
}

export class MealLogEntryEntity {
    readonly id: string;
    readonly userId: string;
    readonly logDate: string;
    readonly slot: MealSlot;
    readonly recipeId: string | null;
    readonly dishName: string;
    readonly portions: number;
    readonly eatenFraction: number;
    readonly creditedCalories: number;
    readonly creditedProteinG: number;
    readonly creditedFatsG: number;
    readonly creditedCarbsG: number;
    readonly creditedWeightG: number;
    readonly totalWeightG: number;
    readonly loggedAt: Date;

    private constructor(row: MealLogEntryRow) {
        this.id = row.id;
        this.userId = row.userId;
        this.logDate = row.logDate;
        this.slot = row.slot as MealSlot;
        this.recipeId = row.recipeId;
        this.dishName = row.dishName;
        this.portions = row.portions;
        // Postgres hands `numeric` back as a string to avoid the precision loss
        // a float would introduce. Everything downstream does arithmetic, so
        // the conversion happens once, here, rather than at each call site.
        this.eatenFraction = Number(row.eatenFraction);
        this.creditedCalories = row.creditedCalories;
        this.creditedProteinG = Number(row.creditedProteinG);
        this.creditedFatsG = Number(row.creditedFatsG);
        this.creditedCarbsG = Number(row.creditedCarbsG);
        this.creditedWeightG = Number(row.creditedWeightG);
        this.totalWeightG = Number(row.totalWeightG);
        this.loggedAt = row.loggedAt;
    }

    static from(row: MealLogEntryRow): MealLogEntryEntity {
        return new MealLogEntryEntity(row);
    }
}

export class WaterLogEntryEntity {
    readonly id: string;
    readonly userId: string;
    readonly logDate: string;
    readonly amountMl: number;
    readonly loggedAt: Date;

    private constructor(row: WaterLogEntryRow) {
        this.id = row.id;
        this.userId = row.userId;
        this.logDate = row.logDate;
        this.amountMl = row.amountMl;
        this.loggedAt = row.loggedAt;
    }

    static from(row: WaterLogEntryRow): WaterLogEntryEntity {
        return new WaterLogEntryEntity(row);
    }
}

export class DailyStepsEntity {
    readonly userId: string;
    readonly logDate: string;
    readonly steps: number;

    private constructor(row: DailyStepsRow) {
        this.userId = row.userId;
        this.logDate = row.logDate;
        this.steps = row.steps;
    }

    static from(row: DailyStepsRow): DailyStepsEntity {
        return new DailyStepsEntity(row);
    }
}
