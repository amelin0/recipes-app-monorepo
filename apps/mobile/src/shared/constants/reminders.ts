/**
 * The meal reminder schedule. Shared: the questionnaire sets it up
 * (882:141275) and the profile edits the same one (804:24801).
 */
export const MEAL_REMINDERS = [
    { key: 'breakfast', hour: 8, minute: 0 },
    { key: 'lunch', hour: 14, minute: 0 },
    { key: 'dinner', hour: 21, minute: 0 },
    { key: 'snack', hour: 11, minute: 0 },
] as const;

/** The minute wheel steps in fives, as the design's 30/35/40 column shows. */
export const REMINDER_MINUTE_STEP = 5;

/** TODO: replace with the saved schedule — when the next weigh-in falls. */
export const MOCK_WEIGH_IN_DATE = '23 жовтня 2026';
