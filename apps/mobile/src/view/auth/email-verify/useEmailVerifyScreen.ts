import { useCallback, useEffect, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import { maskEmail } from '@/shared/helpers';
import { useStore } from '@/state';

const RESEND_COOLDOWN_SECONDS = 30;

type EmailVerifyFlow = 'registration' | 'password-reset';

export const useEmailVerifyScreen = () => {
    const { email, flow } = useLocalSearchParams<{ email?: string; flow?: EmailVerifyFlow }>();
    const switchAuthenticated = useStore(state => state.switchAuthenticatedAction);

    const [code, setCode] = useState('');
    const [resendSeconds, setResendSeconds] = useState(RESEND_COOLDOWN_SECONDS);

    useEffect(() => {
        if (resendSeconds <= 0) return;
        const id = setInterval(() => setResendSeconds(prev => prev - 1), 1000);
        return () => clearInterval(id);
    }, [resendSeconds]);

    const handleComplete = useCallback(
        (_code: string) => {
            // TODO: POST /auth/verify-email once the API ships — mock success.
            if (flow === 'password-reset') {
                router.push('/(app)/(auth)/set-new-password');
                return;
            }
            switchAuthenticated(true);
        },
        [flow, switchAuthenticated],
    );

    const handleResend = useCallback(() => {
        // TODO: POST /auth/resend-code once the API ships.
        setCode('');
        setResendSeconds(RESEND_COOLDOWN_SECONDS);
    }, []);

    return {
        maskedEmail: maskEmail(email ?? ''),
        code,
        setCode,
        handleComplete,
        resendSeconds,
        canResend: resendSeconds <= 0,
        handleResend,
    };
};
