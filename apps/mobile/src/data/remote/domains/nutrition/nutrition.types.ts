import type { RecipeCard } from '../catalog';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface NutritionGoal {
    dailyCalories: number;
    dailyProteinG: number;
    dailyFatsG: number;
    dailyCarbsG: number;
    dailyWaterMl: number;
    dailyFiberG: number;
    dailyStepsTarget: number;
}

export interface MealLogEntry {
    id: string;
    slot: MealSlot;
    recipeId: string | null;
    dishName: string;
    portions: number;
    /** Share of those portions the user ate, 0–1. */
    eatenFraction: number;
    calories: number;
    proteinG: number;
    fatsG: number;
    carbsG: number;
    /** Weight of the share actually eaten. */
    weightG: number;
    /** Weight of the whole cooked dish, portions for others included. */
    totalWeightG: number;
    loggedAt: string;
}

export interface DailyTotals {
    calories: number;
    proteinG: number;
    fatsG: number;
    carbsG: number;
    waterMl: number;
}

export interface DailyPlanItem {
    /** The plan item — the same id the plan tab uses. */
    id: string;
    recipe: RecipeCard;
    /** The meal entry that ate this dish; null while it has not been eaten. */
    eatenEntryId: string | null;
}

export interface DailyPlanSlot {
    slot: MealSlot;
    /** Empty means «Не заплановано». */
    items: DailyPlanItem[];
}

export interface DailySlice {
    date: string;
    /** Null for an account with no goal — the screen then calls the user to set one. */
    goal: NutritionGoal | null;
    consumed: DailyTotals;
    /** What was eaten, planned or not. */
    meals: MealLogEntry[];
    /**
     * The four slots with the dishes planned for this day.
     *
     * Optional because the deployed stand still answers without it — that
     * build predates the field. Until it ships, «Раціон на сьогодні» reads
     * the plan endpoint instead.
     */
    plan?: DailyPlanSlot[];
    steps: number;
    stepsTarget: number;
}

export interface LogMealPayload {
    slot: MealSlot;
    recipeId?: string;
    dishName: string;
    portions: number;
    /** How much of those portions the user ate; the rest went to somebody else. */
    eatenFraction: number;
    /** Per single portion — the server scales by portions and fraction itself. */
    perPortion: {
        calories: number;
        proteinG: number;
        fatsG: number;
        carbsG: number;
        weightG: number;
    };
}

export interface LogWaterPayload {
    amountMl: number;
}

export interface SetStepsPayload {
    /** A running total, not an increment — a second report replaces the first. */
    steps: number;
}

export type UpsertGoalPayload = Omit<NutritionGoal, 'dailyStepsTarget'> & {
    dailyStepsTarget?: number;
};

/** One line of the goal at a time — the card that owns a number edits it alone. */
export type PatchGoalPayload = Partial<NutritionGoal>;
