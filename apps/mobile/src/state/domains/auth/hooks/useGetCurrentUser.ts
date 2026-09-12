import { useQuery } from '@tanstack/react-query';

import { AuthApi } from '@/data';
import { authKeys } from '@/shared/services';
import { useStore } from '@/state';

/**
 * The account's own state — verification and, more importantly, whether a
 * deletion request is pending.
 *
 * It is read before the app decides which screen to open: a pending deletion
 * has to win over everything else, and it is the only place the deadline is
 * readable from. Не кешується надовго — рішення «пустити в застосунок
 * чи на екран відновлення» не можна приймати за вчорашньою відповіддю.
 */
export const useGetCurrentUser = () => {
    const isAuthenticated = useStore(state => state.isAuthenticated);

    return useQuery({
        queryKey: authKeys.me(),
        queryFn: () => AuthApi.me(),
        enabled: isAuthenticated,
        staleTime: 0,
    });
};
