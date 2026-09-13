import { useQuery } from '@tanstack/react-query';

import { UserApi } from '@/data';
import { userKeys } from '@/shared/services';
import { useStore } from '@/state';

/**
 * Identity, avatar and settings in one read. Every settings screen reads its
 * current value from here and writes back through `useUpdateSettings`, so the
 * six switches never disagree about what the server holds.
 *
 * Gated on the session: `GET /profile` behind a missing token answers 401,
 * and the HTTP layer would read that as an expired session and sign the user
 * out of a screen they were never signed in to.
 */
export const useGetProfile = () => {
    const isAuthenticated = useStore(state => state.isAuthenticated);

    return useQuery({
        queryKey: userKeys.profile(),
        queryFn: () => UserApi.getProfile(),
        enabled: isAuthenticated,
        staleTime: 60_000,
    });
};
