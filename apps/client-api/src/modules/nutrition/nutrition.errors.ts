/**
 * Stable machine-readable reasons for the nutrition domain. A wrongly-tapped
 * entry that is already gone and one that never existed look the same to the
 * client, and both should read as "nothing to undo" rather than an error.
 */
export const NutritionErrorCode = {
    GoalNotFound: 'nutrition.goal-not-found',
    MealEntryNotFound: 'nutrition.meal-entry-not-found',
    WaterEntryNotFound: 'nutrition.water-entry-not-found',
} as const;

export type NutritionErrorCode = (typeof NutritionErrorCode)[keyof typeof NutritionErrorCode];
