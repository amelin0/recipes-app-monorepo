/**
 * What a notification is about.
 *
 * It decides the icon in the list and how full the card is: a reminder is a
 * line of text, a system message can carry a subtitle, a bullet list and an
 * action (inbox FR-005).
 */
export enum NotificationType {
    Reminder = 'reminder',
    System = 'system',
    Subscription = 'subscription',
}

/**
 * **Why** a notification exists — the event that produced it.
 *
 * Separate from `NotificationType` on purpose. The type is what the app draws
 * (icon, how full the card is), and the app already maps three of them;
 * folding events into it would mean a new icon case in the client for every
 * new reason we ever write a message.
 *
 * Values below the divider are **declared, not produced**: nothing creates
 * them yet. They are here so the enum, the column and the migration are
 * settled before the first of them ships — but a value in this list is not a
 * promise that a message of that kind exists.
 */
export enum NotificationEvent {
    // --- produced today ---
    /** A subscription became active — bought, gifted or earned. */
    SubscriptionActivated = 'subscription_activated',
    /**
     * Somebody used this account's referral code.
     *
     * Deliberately not «rewarded»: nothing grants the referrer their month yet
     * (a known debt), and an event named after a reward would be a promise the
     * text then has to keep.
     */
    ReferralRedeemed = 'referral_redeemed',
    /** The account is scheduled for deletion; the grace period is running. */
    AccountDeletionRequested = 'account_deletion_requested',
    /** …and the request was taken back. */
    AccountDeletionCancelled = 'account_deletion_cancelled',
    /** A product this person created was verified into the shared catalogue. */
    ProductVerified = 'product_verified',

    // --- declared, not produced yet ---
    /** Editorial: a promotion or an offer. Needs the admin broadcast first. */
    Promo = 'promo',
    /** «Ви сьогодні нічого не записали» — needs the job runner and a timezone. */
    DailyLogReminder = 'daily_log_reminder',
    /** «Час випити води» — same two blockers. */
    WaterReminder = 'water_reminder',
    /** Nobody has opened the app for a while. Needs the job runner. */
    Inactivity = 'inactivity',
    /**
     * Cancelled and will not renew. Nothing in the API cancels a subscription
     * — the store does, and it does not tell us. Needs store notifications.
     */
    SubscriptionCancelled = 'subscription_cancelled',
    /** The subscription runs out in a few days. Needs the job runner. */
    SubscriptionExpiring = 'subscription_expiring',
    /** It ran out. Needs the job runner. */
    SubscriptionExpired = 'subscription_expired',
}
