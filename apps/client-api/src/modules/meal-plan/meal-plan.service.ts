import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { DAILY_TARGET_TOLERANCE } from '@dns/constants';
import {
    MealPlanItemEntity,
    MealPlanRepository,
    NutritionGoalEntity,
    NutritionRepository,
    RecipeEntity,
    RecipeRepository,
    ShoppingListRepository,
} from '@dns/database';
import { DailyOutcome, MealSlot } from '@dns/shared-types';
import { AddPlanItemInput, CopyPlanDayInput, MealPlanRangeQuery } from '@dns/validation';

import { ReaderLanguageService } from '../catalog/reader-language.service';

import { MealPlanErrorCode } from './meal-plan.errors';

/** The four slots, always in this order — a day is missing none of them, only dishes. */
const SLOTS: MealSlot[] = [MealSlot.Breakfast, MealSlot.Lunch, MealSlot.Dinner, MealSlot.Snack];

export interface PlanItem {
    id: string;
    recipe: RecipeEntity;
}

export interface PlanSlot {
    slot: MealSlot;
    items: PlanItem[];
}

export interface PlanTotals {
    calories: number;
    proteinG: number;
    fatsG: number;
    carbsG: number;
}

export interface PlanDay {
    date: string;
    slots: PlanSlot[];
    planned: PlanTotals;
    goal: PlanTotals | null;
    /** Null when there is no goal, or nothing planned — a state, not a verdict. */
    outcome: DailyOutcome | null;
    /**
     * Whether what is planned is already counted into the shopping list.
     *
     * A planned dish needs no «add to list» action: the list sums the plan on
     * every read (weekly-list FR-004), so the row shows a state rather than
     * offering work that is already done. The account-level switch is what
     * decides, and the screen would otherwise have to fetch the whole shopping
     * list to learn one boolean.
     */
    importsIntoShoppingList: boolean;
}

@Injectable()
export class MealPlanService {
    constructor(
        private readonly plan: MealPlanRepository,
        private readonly recipes: RecipeRepository,
        private readonly nutrition: NutritionRepository,
        private readonly language: ReaderLanguageService,
        private readonly shoppingList: ShoppingListRepository,
    ) {}

    /**
     * The whole window in one response, dishes included.
     *
     * The week strip needs a state per day and the selected day needs its
     * items; fetching them separately would make every tap on the strip a
     * round trip, which is exactly what SC-001 rules out.
     */
    async range(userId: string, query: MealPlanRangeQuery): Promise<PlanDay[]> {
        const [items, goal, language, importsIntoShoppingList] = await Promise.all([
            this.plan.findRange(userId, query.from, query.to),
            this.nutrition.findGoal(userId),
            this.language.of(userId),
            this.shoppingList.importFromPlan(userId),
        ]);

        const recipes = await this.recipesById(items, userId, language);

        return datesBetween(query.from, query.to).map(date =>
            this.assemble(date, items, recipes, goal, importsIntoShoppingList),
        );
    }

    async addItem(userId: string, date: string, input: AddPlanItemInput): Promise<PlanDay> {
        if (!(await this.recipes.exists(input.recipeId, userId))) {
            throw new NotFoundException({
                message: 'No such recipe',
                code: MealPlanErrorCode.RecipeNotFound,
            });
        }

        await this.plan.add(userId, date, input.slot, input.recipeId);

        return this.day(userId, date);
    }

    async removeItem(userId: string, date: string, itemId: string): Promise<PlanDay> {
        if (!(await this.plan.removeItem(userId, itemId))) {
            throw new NotFoundException({
                message: 'No such planned dish',
                code: MealPlanErrorCode.ItemNotFound,
            });
        }

        return this.day(userId, date);
    }

    async clearDay(userId: string, date: string): Promise<PlanDay> {
        await this.plan.clearDay(userId, date);
        return this.day(userId, date);
    }

    /**
     * Makes each chosen day a copy of this one.
     *
     * Copying an empty day is refused rather than performed: it would clear
     * every day it was aimed at, which is a destructive act dressed as a
     * harmless one — and the sheet that triggers it has no undo.
     */
    async copyDay(userId: string, date: string, input: CopyPlanDayInput): Promise<PlanDay[]> {
        if (input.targetDates.includes(date)) {
            throw new BadRequestException({
                message: 'A day cannot be copied onto itself',
                code: MealPlanErrorCode.SourceAmongTargets,
            });
        }

        const source = await this.plan.findRange(userId, date, date);
        if (source.length === 0) {
            throw new BadRequestException({
                message: 'This day has nothing to copy',
                code: MealPlanErrorCode.NothingToCopy,
            });
        }

        await this.plan.copyDay(userId, date, input.targetDates);

        const sorted = [...input.targetDates].sort();
        return this.range(userId, {
            from: sorted[0] as string,
            to: sorted[sorted.length - 1] as string,
        }).then(days => days.filter(day => input.targetDates.includes(day.date)));
    }

    private async day(userId: string, date: string): Promise<PlanDay> {
        const [days] = await this.range(userId, { from: date, to: date });
        if (!days) throw new Error('Failed to assemble the plan day');
        return days;
    }

    private async recipesById(
        items: MealPlanItemEntity[],
        userId: string,
        language: string,
    ): Promise<Map<string, RecipeEntity>> {
        const ids = [...new Set(items.map(item => item.recipeId))];
        const found = await this.recipes.findByIds(ids, userId, language);

        return new Map(found.map(recipe => [recipe.id, recipe]));
    }

    private assemble(
        date: string,
        items: MealPlanItemEntity[],
        recipes: Map<string, RecipeEntity>,
        goal: NutritionGoalEntity | null,
        importsIntoShoppingList: boolean,
    ): PlanDay {
        const ofDay = items.filter(item => item.planDate === date);

        const slots = SLOTS.map(slot => ({
            slot,
            items: ofDay
                .filter(item => item.slot === slot)
                .flatMap(item => {
                    const recipe = recipes.get(item.recipeId);
                    // A dish this account can no longer see is dropped rather
                    // than rendered blank. The foreign key cascades, so this is
                    // the narrow window between a delete and this read.
                    return recipe ? [{ id: item.id, recipe }] : [];
                }),
        }));

        // One planned item is one serving, so the day sums the per-serving
        // figures — the same numbers the card in the picker showed.
        const planned = slots
            .flatMap(slot => slot.items)
            .reduce<PlanTotals>(
                (running, item) => ({
                    calories: running.calories + item.recipe.caloriesPerServing,
                    proteinG: running.proteinG + item.recipe.proteinPerServingG,
                    fatsG: running.fatsG + item.recipe.fatsPerServingG,
                    carbsG: running.carbsG + item.recipe.carbsPerServingG,
                }),
                { calories: 0, proteinG: 0, fatsG: 0, carbsG: 0 },
            );

        return {
            date,
            importsIntoShoppingList,
            slots,
            planned: {
                calories: Math.round(planned.calories),
                proteinG: round(planned.proteinG),
                fatsG: round(planned.fatsG),
                carbsG: round(planned.carbsG),
            },
            goal: goal
                ? {
                      calories: goal.dailyCalories,
                      proteinG: goal.dailyProteinG,
                      fatsG: goal.dailyFatsG,
                      carbsG: goal.dailyCarbsG,
                  }
                : null,
            outcome: outcomeFor(planned.calories, goal),
        };
    }
}

/**
 * Whether the plan lands on the day's calorie goal.
 *
 * The band is `DAILY_TARGET_TOLERANCE` — the same ±10 % the progress screen
 * paints a day with (ADR-0007). Two different definitions of «about right»
 * would let the plan tab and the progress chart disagree about the same day.
 *
 * Computed here rather than on the client for the same reason it is on the
 * progress card: the tolerance is a product decision, and a client that
 * applied it itself would freeze the number into a release.
 */
function outcomeFor(calories: number, goal: NutritionGoalEntity | null): DailyOutcome | null {
    if (!goal || calories === 0) return null;

    const lower = goal.dailyCalories * (1 - DAILY_TARGET_TOLERANCE);
    const upper = goal.dailyCalories * (1 + DAILY_TARGET_TOLERANCE);

    if (calories < lower) return DailyOutcome.Under;
    if (calories > upper) return DailyOutcome.Over;
    return DailyOutcome.OnTarget;
}

/** Every date in the window, so a day with nothing planned still comes back. */
function datesBetween(from: string, to: string): string[] {
    const dates: string[] = [];
    for (let at = Date.parse(from); at <= Date.parse(to); at += 86_400_000) {
        dates.push(new Date(at).toISOString().slice(0, 10));
    }
    return dates;
}

function round(value: number): number {
    return Math.round(value * 10) / 10;
}
