import { z } from 'zod';

import { EATEN_FRACTION, LOG_DATE_WINDOW_DAYS, NUTRITION_GOAL_LIMITS } from '@dns/constants';
import { MealSlot } from '@dns/shared-types';

const DAY_MS = 86_400_000;

/**
 * A calendar date in the user's own timezone, supplied by the client.
 *
 * The server cannot derive it: a meal eaten at 01:00 belongs to the night
 * before for the person eating it, and only the device knows which day that
 * was. The window is a sanity bound against a device with a broken clock, wide
 * enough that crossing a date line never trips it.
 */
export const logDateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    .refine(value => !Number.isNaN(Date.parse(value)), 'Date is not a real calendar date')
    .refine(value => {
        const at = Date.parse(value);
        const now = Date.now();
        return at >= now - LOG_DATE_WINDOW_DAYS.past * DAY_MS && at <= now + LOG_DATE_WINDOW_DAYS.future * DAY_MS;
    }, 'Date is outside the window a day may be logged for');

const bounded = (limits: { min: number; max: number }, label: string) =>
    z
        .number()
        .int(`${label} must be a whole number`)
        .min(limits.min, `${label} must be at least ${limits.min}`)
        .max(limits.max, `${label} must be at most ${limits.max}`);

/**
 * The whole goal at once — the screen has a single save action, and a partial
 * body would leave a goal half old and half new.
 *
 * Steps have no configuration screen yet (daily-tracking FR-010 shows the
 * target but nothing sets it), so the field is optional and the service falls
 * back to the default.
 */
export const upsertNutritionGoalSchema = z.object({
    dailyCalories: bounded(NUTRITION_GOAL_LIMITS.calories, 'Calories'),
    dailyProteinG: bounded(NUTRITION_GOAL_LIMITS.proteinG, 'Protein'),
    dailyFatsG: bounded(NUTRITION_GOAL_LIMITS.fatsG, 'Fats'),
    dailyCarbsG: bounded(NUTRITION_GOAL_LIMITS.carbsG, 'Carbs'),
    dailyWaterMl: bounded(NUTRITION_GOAL_LIMITS.waterMl, 'Water'),
    dailyFiberG: bounded(NUTRITION_GOAL_LIMITS.fiberG, 'Fiber'),
    dailyStepsTarget: bounded(NUTRITION_GOAL_LIMITS.steps, 'Steps').optional(),
});

/**
 * One line of the goal at a time.
 *
 * The progress screens let a target be changed from the card it belongs to —
 * the water card edits water, the steps card edits steps (metric-detail
 * FR-005) — and sending the whole goal to move one number would make every
 * such edit overwrite the other five with whatever the screen last read.
 */
export const patchNutritionGoalSchema = upsertNutritionGoalSchema
    .partial()
    .refine(value => Object.keys(value).length > 0, 'Provide at least one target to change');

/**
 * A logged meal carries the dish's own numbers, not a reference to look up.
 *
 * `recipeId` is optional because the recipe catalogue does not exist yet, and
 * the snapshot is what the entry is really made of anyway: the receipt has to
 * keep saying what was true when the meal was eaten, even after the recipe is
 * edited (meal-logging FR-006).
 */
export const logMealSchema = z.object({
    slot: z.nativeEnum(MealSlot),
    recipeId: z.string().uuid('Recipe id must be a UUID').optional(),
    dishName: z.string().trim().min(1, 'Dish name is required').max(200, 'Dish name is too long'),
    portions: z.number().int('Portions must be a whole number').positive('Portions must be at least 1'),
    /** How much of those portions the user ate; the rest went to somebody else. */
    eatenFraction: z
        .number()
        .min(EATEN_FRACTION.min, 'Nothing was eaten')
        .max(EATEN_FRACTION.max, 'Cannot eat more than what was made'),
    /** Per single portion — the server scales by portions and fraction itself. */
    perPortion: z.object({
        calories: z.number().nonnegative(),
        proteinG: z.number().nonnegative(),
        fatsG: z.number().nonnegative(),
        carbsG: z.number().nonnegative(),
        weightG: z.number().positive('A portion must weigh something'),
    }),
});

export const logWaterSchema = z.object({
    amountMl: z.number().int().positive('Amount must be positive').max(5000, 'That is more than a day of water'),
});

export const setStepsSchema = z.object({
    /** A running total, not an increment — a second report of the day replaces the first. */
    steps: z.number().int().min(0, 'Steps cannot be negative').max(200_000, 'That is not a plausible step count'),
});

export type LogDateInput = z.infer<typeof logDateSchema>;
export type UpsertNutritionGoalInput = z.infer<typeof upsertNutritionGoalSchema>;
export type PatchNutritionGoalInput = z.infer<typeof patchNutritionGoalSchema>;
export type LogMealInput = z.infer<typeof logMealSchema>;
export type LogWaterInput = z.infer<typeof logWaterSchema>;
export type SetStepsInput = z.infer<typeof setStepsSchema>;
