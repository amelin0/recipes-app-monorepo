/** How often a plan bills. The two the paywall offers (paywall FR-004). */
export enum BillingPeriod {
    Month = 'month',
    Year = 'year',
}

/**
 * How a subscription came about.
 *
 * Not the same question as which store took the money: a referral month is
 * paid by nobody, and a trial is paid later. The confirmation screen shows
 * this (FR-013), and it decides what happens when the period ends.
 */
export enum SubscriptionSource {
    Purchase = 'purchase',
    Trial = 'trial',
    Referral = 'referral',
}

export enum SubscriptionStatus {
    Active = 'active',
    Expired = 'expired',
    Cancelled = 'cancelled',
}

/** Which store took the payment. `none` covers a referral month, which no store saw. */
export enum PurchaseStore {
    Apple = 'apple',
    Google = 'google',
    None = 'none',
}
