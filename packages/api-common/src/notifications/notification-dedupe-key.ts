/**
 * The keys that make a notification «at most once» (`notifications.dedupe_key`).
 *
 * One place, so that the worker and an API talking about the same occurrence
 * spell its key the same way — two spellings would be two rows, and the index
 * would be guarding nothing.
 *
 * A key names **what happened**, not who is told: uniqueness is per account
 * already, so the recipient is never part of it.
 */
export const NotificationDedupeKey = {
    /**
     * «Premium ends on …» — once per subscription **and end date**.
     *
     * The date is part of it because a subscription's end can move while the
     * row stays the same: a referral reward lengthens the live subscription in
     * place. Keyed on the id alone, somebody warned about 12 October and then
     * given a month would never hear about 12 November.
     */
    subscriptionExpiring: (subscriptionId: string, expiresAt: Date): string =>
        `sub-expiring:${subscriptionId}:${expiresAt.toISOString()}`,

    /** A row goes from active to expired once; nothing makes it active again. */
    subscriptionExpired: (subscriptionId: string): string => `sub-expired:${subscriptionId}`,

    /** Promotion clears the author, so a product can only ever be announced once. */
    productVerified: (productId: string): string => `product-verified:${productId}`,

    /** One redemption per redeemer, one reward per redemption. */
    referralRewarded: (redeemerUserId: string): string => `referral-rewarded:${redeemerUserId}`,
} as const;
