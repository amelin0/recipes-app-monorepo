import { z } from 'zod';

import { MEAL_PLAN_MAX_COPY_TARGETS, MEAL_PLAN_MAX_RANGE_DAYS, MEAL_PLAN_WINDOW_DAYS } from '@dns/constants';
import { MealSlot } from '@dns/shared-types';

import { calendarDateSchema } from './nutrition.schemas';

const DAY_MS = 86_400_000;

/**
 * A day a plan may address.
 *
 * Its own window rather than the log's: planning next month is the point of
 * planning, while logging a meal eaten next month is a broken clock.
 */
export const planDateSchema = calendarDateSchema.refine(value => {
    const at = Date.parse(value);
    const now = Date.now();
    return at >= now - MEAL_PLAN_WINDOW_DAYS.past * DAY_MS && at <= now + MEAL_PLAN_WINDOW_DAYS.future * DAY_MS;
}, 'Date is outside the window a plan may reach');

export const planDateParamSchema = z.object({ date: planDateSchema });

/**
 * The window the week strip shows. A range rather than a `week` number, because
 * where a week starts is the client's business — the server would otherwise
 * have to guess a locale's first weekday and be wrong for somebody.
 */
export const mealPlanRangeSchema = z
    .object({
        from: planDateSchema,
        to: planDateSchema,
    })
    .refine(({ from, to }) => Date.parse(from) <= Date.parse(to), {
        message: 'The range ends before it starts',
        path: ['to'],
    })
    .refine(({ from, to }) => (Date.parse(to) - Date.parse(from)) / DAY_MS < MEAL_PLAN_MAX_RANGE_DAYS, {
        message: `Ask for at most ${MEAL_PLAN_MAX_RANGE_DAYS} days`,
        path: ['to'],
    });

export const addPlanItemSchema = z.object({
    slot: z.nativeEnum(MealSlot),
    recipeId: z.string().uuid(),
});

/**
 * Where to copy a day.
 *
 * The source is excluded here rather than ignored quietly: copying a day onto
 * itself is a request that replaces it with itself, which is harmless but
 * means the caller has misunderstood something.
 */
export const copyPlanDaySchema = z.object({
    targetDates: z
        .array(planDateSchema)
        .min(1, 'Choose at least one day')
        .max(MEAL_PLAN_MAX_COPY_TARGETS)
        .refine(dates => new Set(dates).size === dates.length, 'The same day is listed twice'),
});

export type MealPlanRangeQuery = z.infer<typeof mealPlanRangeSchema>;
export type AddPlanItemInput = z.infer<typeof addPlanItemSchema>;
export type CopyPlanDayInput = z.infer<typeof copyPlanDaySchema>;
