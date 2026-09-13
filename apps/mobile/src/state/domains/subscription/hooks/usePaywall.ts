import { useMutation, useQuery } from '@tanstack/react-query';

import { SubscriptionApi, type RedeemCodePayload } from '@/data';
import { queryClient, subscriptionKeys, Queries } from '@/shared/services';
import { useStore } from '@/state';

/** Plans and the feature list, as the paywall renders them. */
export const useGetPlans = () => {
    const isAuthenticated = useStore(state => state.isAuthenticated);

    return useQuery({
        queryKey: subscriptionKeys.plans(),
        queryFn: () => SubscriptionApi.getPlans(),
        enabled: isAuthenticated,
        staleTime: 30 * 60_000,
    });
};

/**
 * Looks a referral code up before it is spent.
 *
 * Deliberately a mutation, not a query: it runs when the user presses
 * «Застосувати», and keying a query by a half-typed code would fire a request
 * per keystroke.
 */
export const useDescribeReferralCode = () =>
    useMutation({
        mutationFn: (code: string) => SubscriptionApi.describeCode(code),
    });

/**
 * Spends the code. This is the one path to a subscription that needs no
 * store: a referral month is paid by nobody, so there is no receipt to
 * verify.
 */
export const useRedeemReferralCode = () =>
    useMutation({
        mutationFn: (payload: RedeemCodePayload) => SubscriptionApi.redeemCode(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [Queries.Subscription] });
            queryClient.invalidateQueries({ queryKey: [Queries.Referral] });
            queryClient.invalidateQueries({ queryKey: [Queries.Profile] });
        },
    });

/** Stops the paywall opening by itself again. */
export const useDismissPaywall = () =>
    useMutation({
        mutationFn: () => SubscriptionApi.dismissPaywall(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [Queries.Subscription] });
        },
    });
