import assert from 'node:assert/strict';
import { test } from 'node:test';

import { NUTRITION_GOAL_LIMITS } from '@dns/constants';
import { MealSlot } from '@dns/shared-types';

import { logDateSchema, logMealSchema, setStepsSchema, upsertNutritionGoalSchema } from './nutrition.schemas';

const today = (): string => new Date().toISOString().slice(0, 10);
const shifted = (days: number): string => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

const goal = {
    dailyCalories: 1850,
    dailyProteinG: 200,
    dailyFatsG: 60,
    dailyCarbsG: 180,
    dailyWaterMl: 2000,
    dailyFiberG: 30,
};

test('accepts a goal inside every range', () => {
    assert.equal(upsertNutritionGoalSchema.safeParse(goal).success, true);
});

test('rejects a calorie target outside the stepper range', () => {
    assert.equal(
        upsertNutritionGoalSchema.safeParse({ ...goal, dailyCalories: NUTRITION_GOAL_LIMITS.calories.min - 1 }).success,
        false,
    );
    assert.equal(
        upsertNutritionGoalSchema.safeParse({ ...goal, dailyCalories: NUTRITION_GOAL_LIMITS.calories.max + 1 }).success,
        false,
    );
});

test('a goal must carry every nutrient, not just the ones that changed', () => {
    const withoutFiber: Record<string, number> = { ...goal };
    delete withoutFiber.dailyFiberG;

    assert.equal(upsertNutritionGoalSchema.safeParse(withoutFiber).success, false);
});

test('the step target is optional, since nothing sets it yet', () => {
    assert.equal(upsertNutritionGoalSchema.safeParse(goal).success, true);
    assert.equal(upsertNutritionGoalSchema.safeParse({ ...goal, dailyStepsTarget: 12_000 }).success, true);
});

test('a log date must be a real day inside the allowed window', () => {
    assert.equal(logDateSchema.safeParse(today()).success, true);
    assert.equal(logDateSchema.safeParse(shifted(-30)).success, true);

    // A device with a broken clock must not file meals in the far future.
    assert.equal(logDateSchema.safeParse(shifted(30)).success, false);
    assert.equal(logDateSchema.safeParse(shifted(-400)).success, false);
    assert.equal(logDateSchema.safeParse('2026-13-01').success, false);
    assert.equal(logDateSchema.safeParse('06-09-2026').success, false);
});

test('tomorrow is allowed, because crossing a date line must not be rejected', () => {
    assert.equal(logDateSchema.safeParse(shifted(1)).success, true);
});

const meal = {
    slot: MealSlot.Lunch,
    dishName: 'Панкейки',
    portions: 2,
    eatenFraction: 0.5,
    perPortion: { calories: 337, proteinG: 12, fatsG: 9, carbsG: 40, weightG: 210 },
};

test('accepts a logged meal without a recipe id', () => {
    assert.equal(logMealSchema.safeParse(meal).success, true);
});

test('rejects eating nothing, or more than was made', () => {
    assert.equal(logMealSchema.safeParse({ ...meal, eatenFraction: 0 }).success, false);
    assert.equal(logMealSchema.safeParse({ ...meal, eatenFraction: 1.5 }).success, false);
    assert.equal(logMealSchema.safeParse({ ...meal, eatenFraction: 1 }).success, true);
});

test('rejects a fractional or absent portion count', () => {
    assert.equal(logMealSchema.safeParse({ ...meal, portions: 1.5 }).success, false);
    assert.equal(logMealSchema.safeParse({ ...meal, portions: 0 }).success, false);
});

test('rejects a weightless portion, which would make the totals meaningless', () => {
    assert.equal(logMealSchema.safeParse({ ...meal, perPortion: { ...meal.perPortion, weightG: 0 } }).success, false);
});

test('steps replace rather than accumulate, so zero is a legal report', () => {
    assert.equal(setStepsSchema.safeParse({ steps: 0 }).success, true);
    assert.equal(setStepsSchema.safeParse({ steps: -1 }).success, false);
});

test('rejects a day that does not exist, which lenient Date.parse would accept', () => {
    // `Date.parse('2026-02-31')` gives the 3rd of March rather than NaN.
    assert.equal(logDateSchema.safeParse('2026-02-31').success, false);
    assert.equal(logDateSchema.safeParse('2026-13-01').success, false);
});
