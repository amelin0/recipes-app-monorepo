export type SubscriptionPlanId = 'year' | 'month';

export interface SubscriptionPlan {
    id: SubscriptionPlanId;
    /** Charged once per billing period. */
    price: number;
    /** Undiscounted period price — only the yearly plan is discounted. */
    listPrice?: number;
    /** The same plan expressed per month, so the two rows compare directly. */
    monthlyPrice: number;
    /** Percent saved against paying month by month for the same span. */
    savingPercent?: number;
    /** Billing period length, used to derive the subscription's end date. */
    months: number;
}

/**
 * TODO: replace with the plans endpoint — price, currency, saving and trial
 * length are merchandising data the store owns, not app constants.
 */
export const SUBSCRIPTION_PLANS: readonly SubscriptionPlan[] = [
    { id: 'year', price: 59.99, listPrice: 119.88, monthlyPrice: 4.99, savingPercent: 50, months: 12 },
    { id: 'month', price: 9.99, monthlyPrice: 9.99, months: 1 },
];

/** Plan preselected when the paywall opens (911:52892 — the yearly row). */
export const DEFAULT_PLAN_ID: SubscriptionPlanId = 'year';

/** Free days the toggle adds to the yearly plan (911:52912). */
export const TRIAL_DAYS = 7;

/** Everything the subscription unlocks — same list on the paywall and after it. */
export const SUBSCRIPTION_FEATURES = ['recipes', 'meal-plan', 'shopping-list', 'own-recipes', 'progress'] as const;

export type SubscriptionFeature = (typeof SUBSCRIPTION_FEATURES)[number];

/** Store rating shown above the testimonial (911:52880). */
export const STORE_RATING = '4.8';

/**
 * TODO: the referral rules come from the API — the code is validated there and
 * the response says what it grants. The paywall only mirrors the outcome the
 * design shows: a valid code makes the first month free, so it moves the
 * selection onto the monthly plan and prices it at zero.
 */
export const REFERRAL_FREE_MONTHS = 1;
