import { BodyProfile, DailyNorms, Gender, MacroTargets, UserGoal } from '@dns/shared-types';

import { KCAL_PER_GRAM } from './nutrition';

/**
 * Everything here implements ADR-0007. The calorie part rests on
 * Mifflin-St Jeor; the water and step norms are heuristics awaiting sign-off
 * from someone with nutrition expertise — see the ADR's «Що саме треба
 * підписати».
 *
 * Pure functions on purpose: the questionnaire, the goal screen and any future
 * recalculation after a weight change all have to agree, and the cheapest way
 * to guarantee that is for them to call the same code.
 */

/** Physical activity level at each end of the questionnaire's 1–8 slider. */
const PAL_MIN = 1.2;
const PAL_MAX = 1.9;
export const ACTIVITY_LEVEL_RANGE = Object.freeze({ min: 1, max: 8 });

/** How the daily calorie target moves away from maintenance (ADR-0007). */
const GOAL_CALORIE_MULTIPLIER: Record<UserGoal, number> = {
    [UserGoal.Maintain]: 1,
    [UserGoal.LearnCooking]: 1,
    [UserGoal.GainMuscle]: 1.1,
    [UserGoal.LoseWeight]: 0.85,
};

/** Share of the calorie target each macronutrient carries. */
const GOAL_MACRO_SPLIT: Record<UserGoal, { protein: number; fats: number; carbs: number }> = {
    [UserGoal.Maintain]: { protein: 0.3, fats: 0.3, carbs: 0.4 },
    [UserGoal.LearnCooking]: { protein: 0.3, fats: 0.3, carbs: 0.4 },
    // More protein in a deficit, so the weight lost comes off fat rather than muscle.
    [UserGoal.LoseWeight]: { protein: 0.35, fats: 0.3, carbs: 0.35 },
    // More carbohydrate in a surplus — fuel for the training that builds the muscle.
    [UserGoal.GainMuscle]: { protein: 0.3, fats: 0.25, carbs: 0.45 },
};

/** Dietary Guidelines for Americans: 14 g of fibre per 1000 kcal. */
const FIBER_G_PER_1000_KCAL = 14;

const clampActivity = (level: number): number =>
    Math.min(Math.max(Math.round(level), ACTIVITY_LEVEL_RANGE.min), ACTIVITY_LEVEL_RANGE.max);

const roundTo = (value: number, step: number): number => Math.round(value / step) * step;

/**
 * Resting energy expenditure, Mifflin-St Jeor (1990).
 *
 * Chosen over Harris-Benedict, which systematically overestimates on modern
 * populations, and over Katch-McArdle, which needs a body-fat percentage the
 * questionnaire does not collect.
 */
export function basalMetabolicRate({ gender, age, weightKg, heightCm }: BodyProfile): number {
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return gender === Gender.Male ? base + 5 : base - 161;
}

/**
 * Maps the questionnaire's 1–8 slider onto the published PAL range. The ends
 * line up with the literature — «no training» is 1.2, «physical work plus
 * training» is 1.9 — and the eight levels fill the gap evenly. The middle is
 * an assumption; the ends are not.
 */
export function activityMultiplier(activityLevel: number): number {
    const level = clampActivity(activityLevel);
    const span = (PAL_MAX - PAL_MIN) / (ACTIVITY_LEVEL_RANGE.max - ACTIVITY_LEVEL_RANGE.min);

    return PAL_MIN + (level - ACTIVITY_LEVEL_RANGE.min) * span;
}

/** Maintenance calories: what the body spends on an ordinary day. */
export function totalDailyEnergyExpenditure(profile: BodyProfile): number {
    return basalMetabolicRate(profile) * activityMultiplier(profile.activityLevel);
}

/** The three norms the questionnaire shows on steps 14–16. */
export function recommendedDailyNorms(profile: BodyProfile): DailyNorms {
    const calories = totalDailyEnergyExpenditure(profile) * GOAL_CALORIE_MULTIPLIER[profile.goal];
    const level = clampActivity(profile.activityLevel);

    return {
        // Rounded to the step the questionnaire's dial moves in, so the
        // recommendation is a value the user can actually land back on.
        calories: roundTo(calories, 50),
        waterMl: roundTo(profile.weightKg * 30 + (level - 1) * 150, 100),
        steps: roundTo(5000 + (level - 1) * 1500 + (profile.goal === UserGoal.LoseWeight ? 1000 : 0), 500),
    };
}

/**
 * Macro grams for a calorie target. Takes the calories rather than deriving
 * them, because the user may have overridden the recommendation (FR-006h) and
 * the split has to follow what they chose, not what we suggested.
 */
export function macroTargetsFor(calories: number, goal: UserGoal): MacroTargets {
    const split = GOAL_MACRO_SPLIT[goal];

    return {
        proteinG: Math.round((calories * split.protein) / KCAL_PER_GRAM.proteins),
        fatsG: Math.round((calories * split.fats) / KCAL_PER_GRAM.fats),
        carbsG: Math.round((calories * split.carbs) / KCAL_PER_GRAM.carbs),
        fiberG: Math.round((calories / 1000) * FIBER_G_PER_1000_KCAL),
    };
}

/** Whole years, the input the metabolic formula wants. */
export function ageFromBirthDate(birthDate: Date, on: Date = new Date()): number {
    let age = on.getUTCFullYear() - birthDate.getUTCFullYear();
    const monthDelta = on.getUTCMonth() - birthDate.getUTCMonth();

    if (monthDelta < 0 || (monthDelta === 0 && on.getUTCDate() < birthDate.getUTCDate())) {
        age -= 1;
    }

    return age;
}

/**
 * What the questionnaire's wheels can produce, mirrored from
 * `apps/mobile/src/view/onboarding/onboarding.constants.ts` so the server
 * rejects exactly what the client cannot offer.
 *
 * The age bounds follow from the birth-year range the design draws
 * (1940–2012). Whether that is the intended minimum age is an open question
 * in the spec — this is the one line to change when it is answered.
 */
export const ONBOARDING_LIMITS = Object.freeze({
    weightKg: { min: 30, max: 250 },
    heightCm: { min: 130, max: 220 },
    age: { min: 13, max: 100 },
    /** Steps in the questionnaire, question screens and benefit screens together. */
    stepCount: 16,
});

/**
 * Ranges the measurement sheet allows. Wider than the questionnaire's wheels
 * on purpose — that screen is a first guess with a scroll wheel, this one
 * records a reading, and a person may legitimately weigh less than the
 * questionnaire's floor.
 */
export const MEASUREMENT_LIMITS = Object.freeze({
    weight: { min: 20, max: 300, step: 0.1 },
    waist: { min: 30, max: 200, step: 0.1 },
    height: { min: 50, max: 250, step: 0.1 },
});

/**
 * Waist circumference above which the WHO reports increased metabolic risk:
 * 94 cm for men, 80 cm for women.
 *
 * An upper bound rather than a range, because there is no published lower
 * bound to quote — inventing one so the UI could say «60–94» would be making
 * up a health claim to fill a field.
 */
export const WAIST_RECOMMENDED_MAX_CM = Object.freeze({ male: 94, female: 80 });

/**
 * How far a day may fall from its target and still count as hitting it
 * (progress overview FR-006, detail FR-004).
 *
 * The specs describe the three states but never quantify the middle one. Ten
 * per cent is chosen, not sourced: it makes 1850 kcal forgiving between about
 * 1665 and 2035, which reads as «about right» to a person and is narrow enough
 * that the state still means something.
 */
export const DAILY_TARGET_TOLERANCE = 0.1;

/** How much history the progress screens show when the client does not say. */
export const PROGRESS_DEFAULT_DAYS = 30;
export const PROGRESS_MAX_DAYS = 365;
