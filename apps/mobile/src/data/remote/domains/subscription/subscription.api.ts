import { HttpService } from '@/shared/services';

import type {
    Paywall,
    ReferralOffer,
    ReferralOverview,
    RedeemCodePayload,
    Subscription,
    SubscriptionState,
    SubmitReceiptPayload,
} from './subscription.types';

const ENDPOINTS = {
    state: '/subscription',
    plans: '/subscription/plans',
    paywallSeen: '/subscription/paywall/seen',
    receipt: '/subscription/receipt',
    referralCode: (code: string) => `/subscription/referral-codes/${encodeURIComponent(code)}`,
    redemptions: '/subscription/redemptions',
    referral: '/profile/referral',
} as const;

export const SubscriptionApi = {
    /** The answer to «am I subscribed», plus whether the paywall owes an appearance. */
    getState: () => HttpService.get<SubscriptionState>(ENDPOINTS.state),

    getPlans: () => HttpService.get<Paywall>(ENDPOINTS.plans),

    /** Stops the paywall opening by itself again; 204. */
    dismissPaywall: () => HttpService.put<void>(ENDPOINTS.paywallSeen),

    submitReceipt: (payload: SubmitReceiptPayload) => HttpService.post<Subscription>(ENDPOINTS.receipt, payload),

    /** Looks a code up before it is spent — 404 `subscription.referral-code-unknown`. */
    describeCode: (code: string) => HttpService.get<ReferralOffer>(ENDPOINTS.referralCode(code)),

    redeemCode: (payload: RedeemCodePayload) => HttpService.post<Subscription>(ENDPOINTS.redemptions, payload),

    /** This account's own code and what it has earned. */
    getReferral: () => HttpService.get<ReferralOverview>(ENDPOINTS.referral),
};
