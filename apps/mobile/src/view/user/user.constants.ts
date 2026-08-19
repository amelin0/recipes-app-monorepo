import type { SubscriptionPlanId } from '../subscription/subscription.constants';

/** TODO: replace with GET /me once the API ships. */
export const MOCK_PROFILE = {
    name: 'Олександр Купрінський',
    email: 'alex@example.com',
};

/** TODO: replace with the active subscription from GET /me (subscription domain). */
export const MOCK_SUBSCRIPTION: { plan: SubscriptionPlanId; validUntil: string } = {
    plan: 'month',
    /** Already formatted — the date contract is an open question in the spec. */
    validUntil: '30.04.2026',
};

/** TODO: replace with the saved reminder schedule (nutrition domain). */
export const MOCK_WEIGH_IN = {
    /** Already formatted — the date contract is an open question in the spec. */
    nextDate: '23 жовтня 2026',
};
