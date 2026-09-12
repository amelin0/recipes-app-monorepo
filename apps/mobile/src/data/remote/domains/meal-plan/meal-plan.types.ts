import type { RecipeCard } from '../catalog';
import type { MealSlot } from '../nutrition';

export interface PlanTotals {
    calories: number;
    proteinG: number;
    fatsG: number;
    carbsG: number;
}

export interface PlanItem {
    /** The planned item — what a delete targets, not the recipe id. */
    id: string;
    recipe: RecipeCard;
}

export interface PlanSlot {
    slot: MealSlot;
    items: PlanItem[];
}

/** How the day's plan sits against the goal. Null is a state, not a verdict. */
export type PlanOutcome = 'under' | 'on-target' | 'over';

export interface PlanDay {
    /** `YYYY-MM-DD`. */
    date: string;
    /** All four, always, in the order the screen renders them. */
    slots: PlanSlot[];
    planned: PlanTotals;
    /** Null while the account has no goal. */
    goal: PlanTotals | null;
    /** Null with no goal or nothing planned. */
    outcome: PlanOutcome | null;
    /**
     * Whether the planned dishes are already counted into the shopping list.
     *
     * There is no «add to list» action on a dish: the list sums the plan on
     * every read, so this is a state, not an action. The switch lives at
     * `PUT /shopping-list/plan-import`.
     */
    importsIntoShoppingList: boolean;
}

export interface AddPlanItemPayload {
    slot: MealSlot;
    recipeId: string;
}

export interface CopyPlanDayPayload {
    /** Days to copy this one onto, `YYYY-MM-DD` each. */
    targetDates: string[];
}
