/** Interface appearance. `System` follows the device setting (app-settings FR-004). */
export enum Theme {
    Light = 'light',
    Dark = 'dark',
    System = 'system',
}

/**
 * The five reminders the schedule screen shows. Meals carry a time of day;
 * the weigh-in carries a cadence instead (reminders FR-003, FR-004).
 */
export enum ReminderType {
    Breakfast = 'breakfast',
    Lunch = 'lunch',
    Dinner = 'dinner',
    Snack = 'snack',
    WeighIn = 'weigh_in',
}

export const MEAL_REMINDER_TYPES = [
    ReminderType.Breakfast,
    ReminderType.Lunch,
    ReminderType.Dinner,
    ReminderType.Snack,
] as const;

export type MealReminderType = (typeof MEAL_REMINDER_TYPES)[number];

/** State of a deletion request. Derived from timestamps, never stored as a column. */
export enum AccountDeletionState {
    Active = 'active',
    Cancelled = 'cancelled',
    Executed = 'executed',
}
