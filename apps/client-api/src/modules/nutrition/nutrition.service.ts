import { Injectable, NotFoundException } from '@nestjs/common';

import { DAILY_STEPS_TARGET_DEFAULT } from '@dns/constants';
import {
    DailyStepsEntity,
    DailyTotals,
    MealLogEntryEntity,
    NutritionGoalEntity,
    NutritionRepository,
    WaterLogEntryEntity,
} from '@dns/database';
import { LogMealInput, LogWaterInput, SetStepsInput, UpsertNutritionGoalInput } from '@dns/validation';

import { NutritionErrorCode } from './nutrition.errors';

/** Everything the tracking screen renders for one day. */
export interface DailySlice {
    date: string;
    goal: NutritionGoalEntity | null;
    totals: DailyTotals;
    meals: MealLogEntryEntity[];
    steps: number;
    stepsTarget: number;
}

@Injectable()
export class NutritionService {
    constructor(private readonly nutritionRepository: NutritionRepository) {}

    getGoal(userId: string): Promise<NutritionGoalEntity | null> {
        return this.nutritionRepository.findGoal(userId);
    }

    upsertGoal(userId: string, input: UpsertNutritionGoalInput): Promise<NutritionGoalEntity> {
        return this.nutritionRepository.upsertGoal({
            userId,
            ...input,
            // Nothing configures the step target yet, so a save that omits it
            // keeps whatever is there — or takes the default the first time.
            dailyStepsTarget: input.dailyStepsTarget ?? DAILY_STEPS_TARGET_DEFAULT,
        });
    }

    /**
     * One read for the whole tracking screen.
     *
     * `goal` is null for an account that has never set one — the screen shows
     * a call to action rather than rings, and inventing numbers nobody chose
     * would be worse than showing none.
     */
    async getDay(userId: string, date: string): Promise<DailySlice> {
        const [goal, totals, meals, steps] = await Promise.all([
            this.nutritionRepository.findGoal(userId),
            this.nutritionRepository.findDailyTotals(userId, date),
            this.nutritionRepository.findMealLogEntries(userId, date),
            this.nutritionRepository.findSteps(userId, date),
        ]);

        return {
            date,
            goal,
            totals,
            meals,
            steps: steps?.steps ?? 0,
            stepsTarget: goal?.dailyStepsTarget ?? DAILY_STEPS_TARGET_DEFAULT,
        };
    }

    /**
     * Credits what was actually eaten: per-portion figures times the number of
     * portions times the share the user finished. Everything left over was
     * eaten by somebody else and never reaches the stats (meal-details FR-008).
     *
     * The multiplication happens here rather than being taken from the client
     * so the stored receipt cannot disagree with the numbers the confirmation
     * screen showed — both come from the same arithmetic on the same inputs.
     */
    logMeal(userId: string, date: string, input: LogMealInput): Promise<MealLogEntryEntity> {
        const { perPortion, portions, eatenFraction } = input;
        const eaten = portions * eatenFraction;

        return this.nutritionRepository.createMealLogEntry({
            userId,
            logDate: date,
            slot: input.slot,
            recipeId: input.recipeId ?? null,
            dishName: input.dishName,
            portions,
            eatenFraction: eatenFraction.toFixed(3),
            creditedCalories: Math.round(perPortion.calories * eaten),
            creditedProteinG: (perPortion.proteinG * eaten).toFixed(2),
            creditedFatsG: (perPortion.fatsG * eaten).toFixed(2),
            creditedCarbsG: (perPortion.carbsG * eaten).toFixed(2),
            creditedWeightG: (perPortion.weightG * eaten).toFixed(2),
            // The whole cooked dish, portions for others included — shown, never credited.
            totalWeightG: (perPortion.weightG * portions).toFixed(2),
        });
    }

    async deleteMeal(userId: string, id: string): Promise<void> {
        const deleted = await this.nutritionRepository.deleteMealLogEntry(userId, id);

        if (!deleted) {
            throw new NotFoundException({
                message: 'No such meal entry',
                code: NutritionErrorCode.MealEntryNotFound,
            });
        }
    }

    logWater(userId: string, date: string, input: LogWaterInput): Promise<WaterLogEntryEntity> {
        return this.nutritionRepository.createWaterLogEntry({
            userId,
            logDate: date,
            amountMl: input.amountMl,
        });
    }

    async deleteWater(userId: string, id: string): Promise<void> {
        const deleted = await this.nutritionRepository.deleteWaterLogEntry(userId, id);

        if (!deleted) {
            throw new NotFoundException({
                message: 'No such water entry',
                code: NutritionErrorCode.WaterEntryNotFound,
            });
        }
    }

    /** Replaces the day's count — a second report supersedes the first rather than adding to it. */
    setSteps(userId: string, date: string, input: SetStepsInput): Promise<DailyStepsEntity> {
        return this.nutritionRepository.upsertSteps(userId, date, input.steps);
    }
}
