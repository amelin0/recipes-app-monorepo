import { useEffect } from 'react';

import { AuthStorage } from '@/data/local/domains/auth';
import { useStore } from '@/state';

/**
 * Launch-time session restore. Runs once in the root layout.
 *
 * A stored access token is taken at face value rather than verified against
 * `GET /auth/me` first: the token may well be expired, but the HTTP layer
 * refreshes on the first 401 and signs out only when the refresh itself
 * fails. Verifying up front would add a round trip to every cold start and
 * make the splash wait on the network.
 */
export const useRestoreSession = () => {
    const isSessionRestored = useStore(state => state.isSessionRestored);
    const switchAuthenticated = useStore(state => state.switchAuthenticatedAction);
    const markRestored = useStore(state => state.markSessionRestoredAction);

    useEffect(() => {
        let cancelled = false;

        const restore = async () => {
            const token = await AuthStorage.getAccessToken();
            if (cancelled) return;
            if (token) switchAuthenticated(true);
            markRestored();
        };

        void restore();

        return () => {
            cancelled = true;
        };
    }, [markRestored, switchAuthenticated]);

    return isSessionRestored;
};
