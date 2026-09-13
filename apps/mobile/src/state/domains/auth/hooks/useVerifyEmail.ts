import { useMutation } from '@tanstack/react-query';

import { AuthApi, type VerifyEmailPayload } from '@/data';
import { AuthStorage } from '@/data/local/domains/auth';
import { useStore } from '@/state';

/**
 * Confirms the address AND opens the first session — the API answers with
 * tokens, so registration ends signed in rather than back at the login form.
 *
 * 400 `auth.invalid-code` covers a wrong, expired and spent code alike: the
 * server will not say which, because that would let an attacker probe.
 */
export const useVerifyEmail = () => {
    const switchAuthenticated = useStore(state => state.switchAuthenticatedAction);

    return useMutation({
        mutationFn: (payload: VerifyEmailPayload) => AuthApi.verifyEmail(payload),
        onSuccess: async tokens => {
            await AuthStorage.saveTokens(tokens);
            switchAuthenticated(true);
        },
    });
};
