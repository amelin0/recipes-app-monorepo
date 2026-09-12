export type MetricKey = 'weight' | 'calories' | 'water' | 'steps' | 'waist' | 'height';

/** Metrics the user can log a reading for by hand. */
export type ReadingMetricKey = 'weight' | 'waist' | 'height';

export interface ReadingMetricConfig {
    /** Nudge per tap on the stepper. */
    step: number;
    min: number;
    max: number;
    /** Decimals kept when typing or nudging. */
    precision: number;
}

export const READING_METRIC_CONFIG: Record<ReadingMetricKey, ReadingMetricConfig> = {
    weight: { step: 0.1, min: 20, max: 300, precision: 1 },
    waist: { step: 0.1, min: 30, max: 200, precision: 1 },
    height: { step: 0.1, min: 50, max: 250, precision: 1 },
};

/** Macro goals are edited from the goal screen, not the progress screens. */
export const MACRO_GOAL_METRICS = ['protein', 'fats', 'carbs'] as const;
export type MacroGoalMetricKey = (typeof MACRO_GOAL_METRICS)[number];

/** Metrics whose goal the user can edit from a sheet. Calories get their own screen. */
export type GoalMetricKey = 'weight' | 'steps' | 'water' | 'protein' | 'fats' | 'carbs';

export const GOAL_METRIC_CONFIG: Record<GoalMetricKey, ReadingMetricConfig> = {
    weight: { step: 0.1, min: 20, max: 300, precision: 1 },
    // Same steps the questionnaire nudges these goals by.
    steps: { step: 500, min: 1000, max: 50000, precision: 0 },
    water: { step: 100, min: 500, max: 6000, precision: 0 },
    // Macro ranges come from the goal-setup spec (811:40272, 811:40718,
    // 811:41164).
    protein: { step: 5, min: 40, max: 350, precision: 0 },
    fats: { step: 2, min: 20, max: 200, precision: 0 },
    carbs: { step: 5, min: 30, max: 500, precision: 0 },
};
