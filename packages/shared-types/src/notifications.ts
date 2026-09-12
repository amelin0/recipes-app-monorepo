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
     * Still not «rewarded», and it never will be: redeeming earns nothing.
     * The month comes when that person first pays — `ReferralRewarded` — and
     * most of them may never do so, so this text must not promise it.
     */
    ReferralRedeemed = 'referral_redeemed',
    /**
     * Somebody this account invited paid for the first time, and the month
     * was granted — the subscription was lengthened or started. Sent after
     * the grant is committed, so the text can name the new end date.
     */
    ReferralRewarded = 'referral_rewarded',
    /** The account is scheduled for deletion; the grace period is running. */
    AccountDeletionRequested = 'account_deletion_requested',
    /** …and the request was taken back. */
    AccountDeletionCancelled = 'account_deletion_cancelled',
    /** A product this person created was verified into the shared catalogue. */
    ProductVerified = 'product_verified',
    /** The subscription runs out in a few days — written by the nightly job. */
    SubscriptionExpiring = 'subscription_expiring',
    /** It ran out, and the row was marked expired in the same sweep. */
    SubscriptionExpired = 'subscription_expired',

    // --- declared, not produced yet ---
    /** Editorial: a promotion or an offer. Needs the admin broadcast first. */
    Promo = 'promo',
    /**
     * «Ви сьогодні нічого не записали». The job runner exists now; what is
     * still missing is the user's timezone — reminders are wall-clock times,
     * and the server would send them at the wrong hour.
     */
    DailyLogReminder = 'daily_log_reminder',
    /** «Час випити води» — blocked on the same missing timezone. */
    WaterReminder = 'water_reminder',
    /** Nobody has opened the app for a while. Needs a definition of «active». */
    Inactivity = 'inactivity',
    /**
     * Cancelled and will not renew. Nothing in the API cancels a subscription
     * — the store does, and it does not tell us. Needs store notifications.
     */
    SubscriptionCancelled = 'subscription_cancelled',
}
