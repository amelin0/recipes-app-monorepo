import { Injectable, NotFoundException } from '@nestjs/common';

import { DAILY_STEPS_TARGET_DEFAULT } from '@dns/constants';
import {
    DailyStepsEntity,
    DailyTotals,
    MealLogEntryEntity,
    NutritionGoalEntity,
    NutritionRepository,
    RecipeEntity,
    WaterLogEntryEntity,
} from '@dns/database';
import { MealSlot } from '@dns/shared-types';
import {
    LogMealInput,
    LogWaterInput,
    PatchNutritionGoalInput,
    SetStepsInput,
    UpsertNutritionGoalInput,
} from '@dns/validation';

import { MealPlanService, PlanSlot } from '../meal-plan/meal-plan.service';

import { NutritionErrorCode } from './nutrition.errors';

/** A planned dish on the tracking screen, and whether it has been eaten yet. */
export interface DailyPlanItem {
    /** The plan item's id, as the plan tab knows it. */
    id: string;
    recipe: RecipeEntity;
    /**
     * The log entry that ate this dish; null while it has not been eaten.
     * Unmarking is deleting that entry — the ring and the mark read one log.
     */
    eatenEntryId: string | null;
}

export interface DailyPlanSlot {
    slot: MealSlot;
    items: DailyPlanItem[];
}

/** Everything the tracking screen renders for one day. */
export interface DailySlice {
    date: string;
    goal: NutritionGoalEntity | null;
    totals: DailyTotals;
    meals: MealLogEntryEntity[];
    /** All four slots, always — empty ones are «Не заплановано» (FR-005). */
    plan: DailyPlanSlot[];
    steps: number;
    stepsTarget: number;
}

@Injectable()
export class NutritionService {
    constructor(
        private readonly nutritionRepository: NutritionRepository,
        private readonly mealPlanService: MealPlanService,
    ) {}

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
     * Moves one target without disturbing the others — what a progress card's
     * «change goal» sheet does (metric-detail FR-005).
     */
    async patchGoal(userId: string, input: PatchNutritionGoalInput): Promise<NutritionGoalEntity> {
        const goal = await this.nutritionRepository.updateGoal(userId, input);

        if (!goal) {
            throw new NotFoundException({
                message: 'No goal has been set for this account yet',
                code: NutritionErrorCode.GoalNotFound,
            });
        }

        return goal;
    }

    /**
     * One read for the whole tracking screen.
     *
     * `goal` is null for an account that has never set one — the screen shows
     * a call to action rather than rings, and inventing numbers nobody chose
     * would be worse than showing none.
     *
     * The planned dishes come from the meal plan and whether each was eaten
     * from the log, so the screen needs no second request to draw its slots.
     */
    async getDay(userId: string, date: string): Promise<DailySlice> {
        const [goal, totals, meals, steps, slots] = await Promise.all([
            this.nutritionRepository.findGoal(userId),
            this.nutritionRepository.findDailyTotals(userId, date),
            this.nutritionRepository.findMealLogEntries(userId, date),
            this.nutritionRepository.findSteps(userId, date),
            this.mealPlanService.slotsOn(userId, date),
        ]);

        return {
            date,
            goal,
            totals,
            meals,
            plan: markEaten(slots, meals),
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

/**
 * Pairs each planned dish with a log entry for the same recipe in the same
 * slot. **The mark is derived, never stored:** a flag on the plan item would
 * be a second record of the same meal, and the day the two disagreed the dish
 * would read «eaten» while the ring did not count it.
 *
 * Each entry settles one dish, oldest first, so a dish planned twice needs
 * two entries to be eaten twice. An entry with no recipe — or logged into
 * another slot — settles nothing here and still counts in `meals` and the
 * totals.
 */
function markEaten(slots: PlanSlot[], meals: MealLogEntryEntity[]): DailyPlanSlot[] {
    const unclaimed = [...meals].sort((a, b) => a.loggedAt.getTime() - b.loggedAt.getTime());

    return slots.map(({ slot, items }) => ({
        slot,
        items: items.map(item => {
            const index = unclaimed.findIndex(entry => entry.slot === slot && entry.recipeId === item.recipe.id);
            const [entry] = index === -1 ? [] : unclaimed.splice(index, 1);

            return { id: item.id, recipe: item.recipe, eatenEntryId: entry?.id ?? null };
        }),
    }));
}
