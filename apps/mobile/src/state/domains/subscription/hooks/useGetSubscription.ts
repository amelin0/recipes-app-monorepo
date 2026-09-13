import { useQuery } from '@tanstack/react-query';

import { SubscriptionApi } from '@/data';
import { subscriptionKeys } from '@/shared/services';
import { useStore } from '@/state';

/**
 * Current subscription plus whether the paywall still owes an appearance.
 * Read separately from the profile: the deployed API does not yet inline it
 * into `GET /profile`, and the paywall needs the flag on its own anyway.
 */
export const useGetSubscription = () => {
    const isAuthenticated = useStore(state => state.isAuthenticated);

    return useQuery({
        queryKey: subscriptionKeys.state(),
        queryFn: () => SubscriptionApi.getState(),
        enabled: isAuthenticated,
        staleTime: 60_000,
    });
};
