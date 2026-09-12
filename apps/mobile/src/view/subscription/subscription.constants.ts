/** Which of the two rows the design lays out; the API calls them by slug. */
export type SubscriptionPlanId = 'year' | 'month';

/** Store rating shown above the testimonial (911:52880). */
export const STORE_RATING = '4.8';

/** Maps the API's plan slugs onto the two rows the design draws. */
export const PLAN_ID_BY_PERIOD: Record<string, SubscriptionPlanId> = {
    year: 'year',
    month: 'month',
};
