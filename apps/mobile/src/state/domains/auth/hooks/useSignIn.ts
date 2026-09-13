import { useMutation } from '@tanstack/react-query';

import { AuthApi, type LoginPayload } from '@/data';
import { AuthStorage } from '@/data/local/domains/auth';
import { useStore } from '@/state';

/**
 * Signs in and opens the session: tokens to SecureStore, guard flipped.
 *
 * Errors reach the caller as the API's own body — `{ statusCode, message,
 * code }`. Worth branching on: 401 `auth.invalid-credentials` (wrong pair),
 * 403 `auth.email-not-verified` (a fresh code was just emailed, so the screen
 * should route to the verify step), 422 with `errors[]` (field validation).
 */
export const useSignIn = () => {
    const switchAuthenticated = useStore(state => state.switchAuthenticatedAction);

    return useMutation({
        mutationFn: (payload: LoginPayload) => AuthApi.login(payload),
        onSuccess: async tokens => {
            await AuthStorage.saveTokens(tokens);
            switchAuthenticated(true);
        },
    });
};
