/**
 * What a referral code grants.
 *
 * One free month on the monthly plan — the only kind of code the design
 * shows, and the reason it switches the selection to monthly when applied
 * (paywall FR-009). A percentage discount or a longer grant would be a
 * different kind of code, and the spec does not describe one.
 */
export const REFERRAL_REWARD = Object.freeze({
    freeMonths: 1,
    /** The plan the grant lands on; a code applied to any other has nothing to give. */
    planSlug: 'monthly',
});

/** Codes are compared upper-cased and trimmed, so « abc123 » is «ABC123». */
export const REFERRAL_CODE_LENGTH = 8;
