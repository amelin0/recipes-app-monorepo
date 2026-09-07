import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MEAL_PLAN_MAX_COPY_TARGETS, MEAL_PLAN_MAX_RANGE_DAYS, MEAL_PLAN_WINDOW_DAYS } from '@dns/constants';
import { MealSlot } from '@dns/shared-types';

import { addPlanItemSchema, copyPlanDaySchema, mealPlanRangeSchema, planDateSchema } from './meal-plan.schemas';

const shifted = (days: number): string => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

test('a plan reaches into the future, unlike a log', () => {
    assert.equal(planDateSchema.safeParse(shifted(300)).success, true);
    assert.equal(planDateSchema.safeParse(shifted(MEAL_PLAN_WINDOW_DAYS.future + 5)).success, false);
});

test('rejects a date that is not a real day', () => {
    assert.equal(planDateSchema.safeParse('2026-02-31').success, false);
    assert.equal(planDateSchema.safeParse('18-05-2026').success, false);
});

test('accepts a week and refuses a range that runs backwards', () => {
    assert.equal(mealPlanRangeSchema.safeParse({ from: shifted(0), to: shifted(6) }).success, true);
    assert.equal(mealPlanRangeSchema.safeParse({ from: shifted(6), to: shifted(0) }).success, false);
});

test('refuses a window wider than the strip could show', () => {
    assert.equal(
        mealPlanRangeSchema.safeParse({ from: shifted(0), to: shifted(MEAL_PLAN_MAX_RANGE_DAYS) }).success,
        false,
    );
});

test('a planned item names a slot and a dish', () => {
    assert.equal(addPlanItemSchema.safeParse({ slot: MealSlot.Lunch, recipeId: crypto.randomUUID() }).success, true);
    assert.equal(addPlanItemSchema.safeParse({ slot: 'brunch', recipeId: crypto.randomUUID() }).success, false);
});

test('copying needs at least one day, and no day twice', () => {
    const day = shifted(1);

    assert.equal(copyPlanDaySchema.safeParse({ targetDates: [] }).success, false);
    assert.equal(copyPlanDaySchema.safeParse({ targetDates: [day, day] }).success, false);
    assert.equal(
        copyPlanDaySchema.safeParse({
            targetDates: Array.from({ length: MEAL_PLAN_MAX_COPY_TARGETS + 1 }, (_, index) => shifted(index + 1)),
        }).success,
        false,
    );
});
