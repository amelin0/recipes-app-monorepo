/**
 * Exactly the two options the questionnaire offers (profile-setup FR-006a).
 * The value feeds the calorie formula, which has a different constant for
 * each — see ADR-0007. Whether a third option belongs here is an open
 * question in the spec, and it needs an answer about what to substitute in
 * the formula, not just a button.
 */
export enum Gender {
    Male = 'male',
    Female = 'female',
}

/**
 * What the person came for (FR-006f). «Learn to cook» is the odd one out:
 * it is not a weight goal, so no target weight applies and the calorie norm
 * is plain maintenance.
 */
export enum UserGoal {
    Maintain = 'maintain',
    GainMuscle = 'gain-muscle',
    LoseWeight = 'lose-weight',
    LearnCooking = 'learn-cooking',
}

/** Which measurement system the person reads values in. Storage stays metric either way. */
export enum UnitSystem {
    Metric = 'metric',
    Imperial = 'imperial',
}

/** The three daily norms the questionnaire computes and lets the user override. */
export interface DailyNorms {
    calories: number;
    waterMl: number;
    steps: number;
}

/** Grams per day, derived from the calorie norm and the goal. */
export interface MacroTargets {
    proteinG: number;
    fatsG: number;
    carbsG: number;
    fiberG: number;
}

/** What the questionnaire needs before it can compute anything. */
export interface BodyProfile {
    gender: Gender;
    /** Whole years at the time of the calculation. */
    age: number;
    weightKg: number;
    heightCm: number;
    /** 1–8, as the questionnaire's slider reports it. */
    activityLevel: number;
    goal: UserGoal;
}
