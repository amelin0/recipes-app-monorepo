import { useMutation } from '@tanstack/react-query';

import {
    AuthApi,
    type RequestPasswordResetPayload,
    type SetNewPasswordPayload,
    type VerifyPasswordResetPayload,
} from '@/data';

/** Step 1 — always 204, so the screen advances without learning if the account exists. */
export const useRequestPasswordReset = () =>
    useMutation({
        mutationFn: (payload: RequestPasswordResetPayload) => AuthApi.requestPasswordReset(payload),
    });

/**
 * Step 2 — trades the emailed code for a short-lived permit. The permit, not
 * the code, is what step 3 spends, so a code cannot be replayed after use.
 */
export const useVerifyPasswordReset = () =>
    useMutation({
        mutationFn: (payload: VerifyPasswordResetPayload) => AuthApi.verifyPasswordReset(payload),
    });

/**
 * Step 3 — sets the password and revokes every existing session, this device
 * included. That is why the flow ends on «Увійти з новим паролем» rather than
 * dropping the user into the app.
 */
export const useSetNewPassword = () =>
    useMutation({
        mutationFn: (payload: SetNewPasswordPayload) => AuthApi.setNewPassword(payload),
    });
