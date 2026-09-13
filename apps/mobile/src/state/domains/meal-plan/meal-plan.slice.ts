import type { StateCreator } from 'zustand';

import type { MealSlot } from '@/data';
import { toIsoDay } from '@/shared/helpers';

/** Colors a goal metric by how the day's plan relates to the target. */
export type PlanMetricTone = 'neutral' | 'progress' | 'positive' | 'negative';

export interface PlanMetric {
    current: number;
    target: number;
    /** Colors the 3pt progress bar. */
    tone: PlanMetricTone;
    /** Colors the value text — the design darkens it outside warning states. */
    valueTone?: PlanMetricTone;
}

/** Which advisory the goal card shows under the metrics (435:13917/14102/14287). */
export type PlanTip = 'low' | 'over' | 'near' | 'none';

export type PlanMealKey = MealSlot;

export const PLAN_MEAL_KEYS: PlanMealKey[] = ['breakfast', 'lunch', 'dinner', 'snack'];

/**
 * Reads a meal slot out of a deep link. An unknown one falls back to lunch so
 * an add never disappears into a slot that does not exist.
 */
export const resolvePlanMeal = (mealParam: unknown): PlanMealKey =>
    PLAN_MEAL_KEYS.find(key => key === mealParam) ?? 'lunch';

/**
 * Reads a plan date out of a deep link. Anything that is not a calendar day
 * falls back to today — the plan is addressed by ISO date now, and a stale
 * link carrying `mon` must not write into a day nobody is looking at.
 */
export const resolvePlanDate = (dayParam: unknown): string =>
    typeof dayParam === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dayParam) ? dayParam : toIsoDay();

export type PlanMacroKey = 'protein' | 'fats' | 'carbs';

export interface PlanDishMacro {
    key: PlanMacroKey;
    /** Grams of this macro in the dish. */
    value: number;
}

/** One dish planned into a meal — the shape the MealCard widget renders. */
export interface PlanDish {
    id: string;
    emoji: string;
    photoUrl?: string | null;
    name: string;
    calories: number;
    macros: PlanDishMacro[];
}

export interface PlanMeal {
    key: PlanMealKey;
    /** Planned time, absent for «Перекус» (961:59371). */
    time?: string;
    dishes: PlanDish[];
}

/** Colors the day tile in the week strip (961:59184). */
export type PlanDayStatus = 'ok' | 'over' | 'under' | 'empty';

export interface PlanDay {
    /** ISO `YYYY-MM-DD` — the key every plan endpoint takes. */
    key: string;
    /** «ПН» */
    weekday: string;
    /** «18» */
    date: string;
    status: PlanDayStatus;
    kcal: PlanMetric;
    protein: PlanMetric;
    fats: PlanMetric;
    carbs: PlanMetric;
    tip: PlanTip;
    meals: PlanMeal[];
}

/**
 * What the plan tab keeps between visits: which day is open.
 *
 * The plan itself lives on the server and is read per date range — holding a
 * copy here would give the same dish two owners, and the picker and the tab
 * would drift apart the moment one of them wrote.
 */
export interface MealPlanSlice {
    selectedPlanDate: string;
    setSelectedPlanDate: (date: string) => void;
    resetPlanDate: () => void;
}

export const createMealPlanSlice: StateCreator<MealPlanSlice, [], [], MealPlanSlice> = set => ({
    selectedPlanDate: toIsoDay(),
    setSelectedPlanDate: selectedPlanDate => set(() => ({ selectedPlanDate })),
    resetPlanDate: () => set(() => ({ selectedPlanDate: toIsoDay() })),
});
