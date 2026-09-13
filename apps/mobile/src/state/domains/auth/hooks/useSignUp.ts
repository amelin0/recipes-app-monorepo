import { useMutation } from '@tanstack/react-query';

import { AuthApi, type RegisterPayload } from '@/data';

/**
 * Creates the account. 201 with no body — the session starts only after the
 * emailed code is verified, so nothing is stored here.
 *
 * Worth branching on: 409 `auth.email-taken`, 422 with `errors[]`.
 */
export const useSignUp = () =>
    useMutation({
        mutationFn: (payload: RegisterPayload) => AuthApi.register(payload),
    });
