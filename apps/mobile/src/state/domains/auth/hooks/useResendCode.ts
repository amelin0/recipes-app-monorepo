import { useMutation } from '@tanstack/react-query';

import { AuthApi, type ResendCodePayload } from '@/data';

/**
 * Always 204, even for an address that has no account — the endpoint refuses
 * to reveal who is registered. So the screen starts its cooldown on success
 * and says nothing about whether an email actually went out.
 */
export const useResendCode = () =>
    useMutation({
        mutationFn: (payload: ResendCodePayload) => AuthApi.resendCode(payload),
    });
