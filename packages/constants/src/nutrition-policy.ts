/**
 * Ranges and steps for the daily goal, straight from goal-setup FR-002 and
 * FR-003. Product policy, so they live here rather than in env — and the
 * client's steppers read the same numbers the server validates against.
 */
export const NUTRITION_GOAL_LIMITS = Object.freeze({
    calories: { min: 1000, max: 5000, step: 50 },
    proteinG: { min: 40, max: 350, step: 5 },
    fatsG: { min: 20, max: 200, step: 2 },
    carbsG: { min: 30, max: 500, step: 5 },
    waterMl: { min: 500, max: 5000, step: 100 },
    fiberG: { min: 10, max: 60, step: 1 },
    steps: { min: 1000, max: 50_000, step: 500 },
});

/** One tap on the water card adds this much (daily-tracking FR-007). */
export const WATER_PORTION_ML = 250;

/**
 * Used when a day is read before the user has set a goal. The client shows a
 * call to action instead of the rings, so these are only a fallback for the
 * step target, which has no configuration screen at all yet.
 */
export const DAILY_STEPS_TARGET_DEFAULT = 15_000;

/**
 * A logged portion may be partly eaten (meal-logging FR-003). Stored as a
 * fraction rather than a percentage so the arithmetic never rounds twice.
 */
export const EATEN_FRACTION = Object.freeze({ min: 0.01, max: 1 });

/**
 * How far back and forward a day may be written. Guards against a device with
 * a wrong clock filing meals in 2073, without being so tight that a traveller
 * crossing a date line gets rejected.
 */
export const LOG_DATE_WINDOW_DAYS = Object.freeze({ past: 365, future: 1 });
