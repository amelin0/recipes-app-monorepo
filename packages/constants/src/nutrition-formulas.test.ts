import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BodyProfile, Gender, UserGoal } from '@dns/shared-types';

import {
    activityMultiplier,
    ageFromBirthDate,
    basalMetabolicRate,
    macroTargetsFor,
    recommendedDailyNorms,
} from './nutrition-formulas';

const MAN: BodyProfile = {
    gender: Gender.Male,
    age: 30,
    weightKg: 80,
    heightCm: 180,
    activityLevel: 1,
    goal: UserGoal.Maintain,
};

const WOMAN: BodyProfile = { ...MAN, gender: Gender.Female, weightKg: 60, heightCm: 165 };

test('reproduces the published Mifflin-St Jeor result', () => {
    // 10·80 + 6.25·180 − 5·30 + 5 = 800 + 1125 − 150 + 5
    assert.equal(basalMetabolicRate(MAN), 1780);

    // 10·60 + 6.25·165 − 5·30 − 161 = 600 + 1031.25 − 150 − 161
    assert.equal(basalMetabolicRate(WOMAN), 1320.25);
});

test('the same body burns less as it ages', () => {
    const older = basalMetabolicRate({ ...MAN, age: 60 });
    assert.ok(older < basalMetabolicRate(MAN));
    // The formula subtracts 5 kcal per year, so thirty years is 150.
    assert.equal(basalMetabolicRate(MAN) - older, 150);
});

test('the activity slider lands exactly on the published range at both ends', () => {
    assert.equal(activityMultiplier(1), 1.2);
    assert.equal(activityMultiplier(8), 1.9);
});

test('the activity multiplier rises with every level and never leaves the range', () => {
    for (let level = 2; level <= 8; level++) {
        assert.ok(activityMultiplier(level) > activityMultiplier(level - 1));
    }

    // Out-of-range input is clamped rather than extrapolated: a nonsense
    // level must not produce a nonsense norm.
    assert.equal(activityMultiplier(0), 1.2);
    assert.equal(activityMultiplier(99), 1.9);
});

test('the goal moves the calorie norm in the direction it names', () => {
    const maintain = recommendedDailyNorms({ ...MAN, goal: UserGoal.Maintain }).calories;
    const lose = recommendedDailyNorms({ ...MAN, goal: UserGoal.LoseWeight }).calories;
    const gain = recommendedDailyNorms({ ...MAN, goal: UserGoal.GainMuscle }).calories;

    assert.ok(lose < maintain);
    assert.ok(gain > maintain);

    // Learning to cook is not a weight goal — it must not move anything.
    assert.equal(recommendedDailyNorms({ ...MAN, goal: UserGoal.LearnCooking }).calories, maintain);
});

test('norms land on the steps the questionnaire dials move in', () => {
    const norms = recommendedDailyNorms({ ...MAN, activityLevel: 5 });

    assert.equal(norms.calories % 50, 0);
    assert.equal(norms.waterMl % 100, 0);
    assert.equal(norms.steps % 500, 0);
});

test('a heavier person is told to drink more', () => {
    const light = recommendedDailyNorms({ ...MAN, weightKg: 50 }).waterMl;
    const heavy = recommendedDailyNorms({ ...MAN, weightKg: 100 }).waterMl;

    assert.ok(heavy > light);
});

test('a more active person is given a higher step target', () => {
    assert.ok(recommendedDailyNorms({ ...MAN, activityLevel: 8 }).steps > recommendedDailyNorms(MAN).steps);
});

test('macro grams add back up to the calories they came from', () => {
    const calories = 2000;
    const macros = macroTargetsFor(calories, UserGoal.Maintain);

    const fromMacros = macros.proteinG * 4 + macros.carbsG * 4 + macros.fatsG * 9;
    // Rounding to whole grams costs a few kcal; anything more means the split
    // no longer sums to one.
    assert.ok(Math.abs(fromMacros - calories) <= 10, `expected ~${calories}, got ${fromMacros}`);
});

test('losing weight gets more protein than maintaining', () => {
    const maintain = macroTargetsFor(2000, UserGoal.Maintain);
    const lose = macroTargetsFor(2000, UserGoal.LoseWeight);

    assert.ok(lose.proteinG > maintain.proteinG);
});

test('fibre follows the calorie target at 14 g per 1000 kcal', () => {
    assert.equal(macroTargetsFor(2000, UserGoal.Maintain).fiberG, 28);
    assert.equal(macroTargetsFor(1500, UserGoal.Maintain).fiberG, 21);
});

test('age counts whole years and respects the birthday', () => {
    const birth = new Date(Date.UTC(1995, 5, 15));

    assert.equal(ageFromBirthDate(birth, new Date(Date.UTC(2026, 5, 14))), 30);
    assert.equal(ageFromBirthDate(birth, new Date(Date.UTC(2026, 5, 15))), 31);
    assert.equal(ageFromBirthDate(birth, new Date(Date.UTC(2026, 6, 1))), 31);
});

test('a small older woman losing weight still gets a plausible number', () => {
    // The lowest realistic input the questionnaire allows. ADR-0007 flags that
    // the formula has no floor — this test records what it currently produces
    // so a future floor is a visible change, not a silent one.
    const norms = recommendedDailyNorms({
        gender: Gender.Female,
        age: 60,
        weightKg: 45,
        heightCm: 150,
        activityLevel: 1,
        goal: UserGoal.LoseWeight,
    });

    assert.ok(norms.calories > 900, `unexpectedly low: ${norms.calories}`);
    assert.ok(norms.calories < 1300, `unexpectedly high: ${norms.calories}`);
});
