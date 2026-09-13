import { useQuery } from '@tanstack/react-query';

import { SubscriptionApi } from '@/data';
import { subscriptionKeys } from '@/shared/services';
import { useStore } from '@/state';

/**
 * This account's referral code and its tally. The code is minted on the first
 * read, so opening the screen is what creates it.
 */
export const useGetReferral = () => {
    const isAuthenticated = useStore(state => state.isAuthenticated);

    return useQuery({
        queryKey: subscriptionKeys.referral(),
        queryFn: () => SubscriptionApi.getReferral(),
        enabled: isAuthenticated,
    });
};
