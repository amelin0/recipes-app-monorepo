/**
 * The four meal slots a day is divided into. Same vocabulary as the meal
 * reminders, but a different concern — a reminder is a notification, a slot is
 * where an eaten dish is filed.
 */
export enum MealSlot {
    Breakfast = 'breakfast',
    Lunch = 'lunch',
    Dinner = 'dinner',
    Snack = 'snack',
}

/** Consumed-versus-target for one nutrient, as the tracking cards render it. */
export interface NutrientProgress {
    consumed: number;
    target: number;
}
