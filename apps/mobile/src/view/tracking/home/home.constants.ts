import type { MealSlot } from '@/data';

/** Screen order — the API returns the four slots, but not necessarily in it. */
export const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

/**
 * Illustrative tile for a dish with no photo. Per slot rather than per dish:
 * nothing in the payload says what a dish looks like, and guessing from its
 * name would be wrong more often than it was right.
 */
export const SLOT_EMOJI: Record<MealSlot, string> = {
    breakfast: '🥞',
    lunch: '🥗',
    dinner: '🍲',
    snack: '🍎',
};

/**
 * Times shown on the meal cards when the user has no reminder set for that
 * slot. The reminder schedule is the real source — these only fill the gap
 * for somebody who turned the reminders off.
 */
export const DEFAULT_SLOT_TIME: Record<MealSlot, string> = {
    breakfast: '8:00',
    lunch: '14:00',
    dinner: '21:00',
    snack: '11:00',
};

/** One glass, as the design's «+» adds it. */
export const WATER_STEP_ML = 250;
