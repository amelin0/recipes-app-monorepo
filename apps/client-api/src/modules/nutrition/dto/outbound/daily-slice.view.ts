import { ApiProperty } from '@nestjs/swagger';

import { MealLogEntryEntity, NutritionGoalEntity } from '@dns/database';
import { MealSlot } from '@dns/shared-types';

import { DailySlice } from '../../nutrition.service';

export class NutritionGoalView {
    @ApiProperty() readonly dailyCalories: number;
    @ApiProperty() readonly dailyProteinG: number;
    @ApiProperty() readonly dailyFatsG: number;
    @ApiProperty() readonly dailyCarbsG: number;
    @ApiProperty() readonly dailyWaterMl: number;
    @ApiProperty() readonly dailyFiberG: number;
    @ApiProperty() readonly dailyStepsTarget: number;

    private constructor(goal: NutritionGoalEntity) {
        this.dailyCalories = goal.dailyCalories;
        this.dailyProteinG = goal.dailyProteinG;
        this.dailyFatsG = goal.dailyFatsG;
        this.dailyCarbsG = goal.dailyCarbsG;
        this.dailyWaterMl = goal.dailyWaterMl;
        this.dailyFiberG = goal.dailyFiberG;
        this.dailyStepsTarget = goal.dailyStepsTarget;
    }

    static from(goal: NutritionGoalEntity): NutritionGoalView {
        return new NutritionGoalView(goal);
    }
}

export class MealLogEntryView {
    @ApiProperty({ format: 'uuid' }) readonly id: string;
    @ApiProperty({ enum: MealSlot }) readonly slot: MealSlot;
    @ApiProperty({ nullable: true, format: 'uuid' }) readonly recipeId: string | null;
    @ApiProperty() readonly dishName: string;
    @ApiProperty() readonly portions: number;
    @ApiProperty({ description: 'Share of those portions the user ate, 0–1.' })
    readonly eatenFraction: number;
    @ApiProperty() readonly calories: number;
    @ApiProperty() readonly proteinG: number;
    @ApiProperty() readonly fatsG: number;
    @ApiProperty() readonly carbsG: number;
    @ApiProperty({ description: 'Weight of the share actually eaten.' }) readonly weightG: number;
    @ApiProperty({ description: 'Weight of the whole cooked dish, portions for others included.' })
    readonly totalWeightG: number;
    @ApiProperty() readonly loggedAt: string;

    private constructor(entry: MealLogEntryEntity) {
        this.id = entry.id;
        this.slot = entry.slot;
        this.recipeId = entry.recipeId;
        this.dishName = entry.dishName;
        this.portions = entry.portions;
        this.eatenFraction = entry.eatenFraction;
        this.calories = entry.creditedCalories;
        this.proteinG = entry.creditedProteinG;
        this.fatsG = entry.creditedFatsG;
        this.carbsG = entry.creditedCarbsG;
        this.weightG = entry.creditedWeightG;
        this.totalWeightG = entry.totalWeightG;
        this.loggedAt = entry.loggedAt.toISOString();
    }

    static from(entry: MealLogEntryEntity): MealLogEntryView {
        return new MealLogEntryView(entry);
    }
}

export class DailyTotalsView {
    @ApiProperty() readonly calories: number;
    @ApiProperty() readonly proteinG: number;
    @ApiProperty() readonly fatsG: number;
    @ApiProperty() readonly carbsG: number;
    @ApiProperty() readonly waterMl: number;

    private constructor(totals: DailySlice['totals']) {
        this.calories = totals.calories;
        this.proteinG = totals.proteinG;
        this.fatsG = totals.fatsG;
        this.carbsG = totals.carbsG;
        this.waterMl = totals.waterMl;
    }

    static from(totals: DailySlice['totals']): DailyTotalsView {
        return new DailyTotalsView(totals);
    }
}

/**
 * The whole tracking screen in one payload. `goal` is null for an account that
 * has not set one — the screen then shows a call to action instead of rings.
 */
export class DailySliceView {
    @ApiProperty({ example: '2026-09-06' }) readonly date: string;

    @ApiProperty({ type: NutritionGoalView, nullable: true })
    readonly goal: NutritionGoalView | null;

    @ApiProperty({ type: DailyTotalsView }) readonly consumed: DailyTotalsView;

    @ApiProperty({ type: [MealLogEntryView] }) readonly meals: MealLogEntryView[];

    @ApiProperty() readonly steps: number;

    @ApiProperty({ description: 'Falls back to a product default while no screen configures it.' })
    readonly stepsTarget: number;

    private constructor(slice: DailySlice) {
        this.date = slice.date;
        this.goal = slice.goal ? NutritionGoalView.from(slice.goal) : null;
        this.consumed = DailyTotalsView.from(slice.totals);
        this.meals = slice.meals.map(MealLogEntryView.from);
        this.steps = slice.steps;
        this.stepsTarget = slice.stepsTarget;
    }

    static from(slice: DailySlice): DailySliceView {
        return new DailySliceView(slice);
    }
}
