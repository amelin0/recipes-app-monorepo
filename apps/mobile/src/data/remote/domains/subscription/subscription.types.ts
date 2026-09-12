export type BillingPeriod = 'month' | 'year';
export type SubscriptionSource = 'purchase' | 'trial' | 'referral';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';
export type PurchaseStore = 'apple' | 'google' | 'none';

/** A named value from the catalog — used here for the paywall's feature list. */
export interface Reference {
    id: string;
    slug: string;
    name: string;
}

/** Prices are in minor units (cents): money in a float is a rounding bug waiting for a decimal. */
export interface Plan {
    id: string;
    slug: string;
    name: string;
    period: BillingPeriod;
    priceCents: number;
    /** Struck through beside the price where there is a discount. */
    fullPriceCents: number | null;
    /** What a month of this plan costs — the figure the two plans compare on. */
    monthlyPriceCents: number;
    currency: string;
    /** 0 means this plan offers no trial. */
    trialDays: number;
    savingsPercent: number | null;
    /** Selected when the paywall opens. */
    isDefault: boolean;
    appleProductId: string | null;
    googleProductId: string | null;
}

export interface Paywall {
    plans: Plan[];
    features: Reference[];
}

export interface Subscription {
    id: string;
    planId: string;
    planSlug: string;
    planName: string;
    period: BillingPeriod;
    source: SubscriptionSource;
    status: SubscriptionStatus;
    store: PurchaseStore;
    startedAt: string;
    expiresAt: string;
    /** Whole days left, rounded up — eighteen hours is still a day to the reader. */
    daysRemaining: number;
    pricePaidCents: number;
    fullPriceCents: number | null;
    currency: string;
    referralCode: string | null;
}

export interface SubscriptionState {
    /** Null while the account is on the free tier. */
    subscription: Subscription | null;
    /** Whether the paywall should open by itself (FR-007). */
    paywallPending: boolean;
}

/** What a referral code grants, answered before it is spent. */
export interface ReferralOffer {
    code: string;
    freeMonths: number;
    /** The plan the grant lands on; the paywall preselects it (FR-009). */
    planSlug: string;
}

export interface ReferralOverview {
    /** This account's own code, minted the first time it is asked for. */
    code: string;
    invited: number;
    /** Invitees who have since paid — the reward condition. */
    converted: number;
    monthsEarned: number;
}

export interface SubmitReceiptPayload {
    store: 'apple' | 'google';
    receipt: string;
    planId?: string;
}

export interface RedeemCodePayload {
    code: string;
}
