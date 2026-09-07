import { Language, MetricSystem, ReminderType, Theme } from '@dns/shared-types';

/**
 * What a brand-new account starts with. Rows are written at sign-up rather
 * than synthesised on read: the reminder table is what a notification
 * scheduler will iterate over, and a user who never opened the settings
 * screen still has reminders to fire.
 */
export const USER_SETTINGS_DEFAULTS = Object.freeze({
    language: Language.Ukrainian,
    theme: Theme.System,
    massUnit: MetricSystem.Metric,
    productWeightUnit: MetricSystem.Metric,
    lengthUnit: MetricSystem.Metric,
    waterUnit: MetricSystem.Metric,
});

/** Times from the questionnaire step (onboarding profile-setup FR-012). */
export const MEAL_REMINDER_DEFAULTS: readonly { type: ReminderType; hour: number; minute: number }[] = Object.freeze([
    { type: ReminderType.Breakfast, hour: 8, minute: 0 },
    { type: ReminderType.Snack, hour: 11, minute: 0 },
    { type: ReminderType.Lunch, hour: 14, minute: 0 },
    { type: ReminderType.Dinner, hour: 21, minute: 0 },
]);

/**
 * Weigh-in cadence in days. Stored as a number rather than an enum because
 * the design only ever names one value («Кожні 2 тижні») and the spec leaves
 * editability open — an enum would be inventing the other members.
 */
export const WEIGH_IN_PERIODICITY_DAYS_DEFAULT = 14;

/** Grace period before a deletion request is executed (account-deletion FR-001). */
export const ACCOUNT_DELETION_GRACE_DAYS = 30;

/** The minute wheel steps in fives, matching the picker in the design. */
export const REMINDER_MINUTE_STEP = 5;
