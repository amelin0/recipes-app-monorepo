import { useCallback } from 'react';

import { AuthApi } from '@/data';
import { AuthStorage } from '@/data/local/domains/auth';
import { queryClient } from '@/shared/services';
import { useStore } from '@/state';

/**
 * Ends the session everywhere it is held: the server's refresh-token row, the
 * device's SecureStore, the query cache and the zustand store.
 *
 * The server call is best-effort — a user who taps «Вийти» offline still has
 * to end up signed out locally, and a refresh token left alive on the server
 * expires on its own.
 */
export const useSignOut = () => {
    const reset = useStore(state => state.reset);

    return useCallback(async () => {
        const refreshToken = await AuthStorage.getRefreshToken();

        if (refreshToken) {
            try {
                await AuthApi.logout(refreshToken);
            } catch {
                // Best-effort: the local sign-out below must happen regardless.
            }
        }

        await AuthStorage.removeTokens();
        reset();
        // After the guard flips — otherwise a still-mounted screen refetches
        // with a token that is already gone and takes a 401 on the way out.
        queryClient.clear();
    }, [reset]);
};
