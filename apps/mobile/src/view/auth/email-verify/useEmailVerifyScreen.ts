import { useCallback, useEffect, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import { OTP_RESEND_COOLDOWN_SECONDS } from '@/shared/constants';
import { maskEmail } from '@/shared/helpers';
import { ToastService } from '@/shared/services';
import { apiErrorCode } from '@/shared/utils';
import { useAppTranslation } from '@/shared/utils/translations';
import { useResendCode, useVerifyEmail, useVerifyPasswordReset } from '@/state/domains/auth';

type EmailVerifyFlow = 'registration' | 'password-reset';

/**
 * One screen, two flows. Registration trades the code for a session;
 * the reset flow trades it for a permit that the next screen spends.
 */
export const useEmailVerifyScreen = () => {
    const { t } = useAppTranslation(['auth', 'common']);
    const { email = '', flow } = useLocalSearchParams<{ email?: string; flow?: EmailVerifyFlow }>();

    const verifyEmail = useVerifyEmail();
    const verifyReset = useVerifyPasswordReset();
    const resendCode = useResendCode();

    const [code, setCode] = useState('');
    const [error, setError] = useState<string>();
    const [resendSeconds, setResendSeconds] = useState(OTP_RESEND_COOLDOWN_SECONDS);

    useEffect(() => {
        if (resendSeconds <= 0) return;
        const id = setInterval(() => setResendSeconds(prev => prev - 1), 1000);
        return () => clearInterval(id);
    }, [resendSeconds]);

    const handleChangeCode = useCallback((value: string) => {
        setError(undefined);
        setCode(value);
    }, []);

    const isPending = verifyEmail.isPending || verifyReset.isPending;

    const handleFailure = useCallback(
        (failure: unknown) => {
            setCode('');
            // 400 `auth.invalid-code` покриває і невірний, і протермінований, і
            // вже витрачений код — сервер навмисно не розрізняє їх у відповіді.
            setError(
                apiErrorCode(failure) === 'auth.invalid-code'
                    ? t('auth:email-verify.invalid-code')
                    : t('common:states.error'),
            );
        },
        [t],
    );

    const handleComplete = useCallback(
        (submitted: string) => {
            if (isPending || !email) return;

            if (flow === 'password-reset') {
                verifyReset.mutate(
                    { email, code: submitted },
                    {
                        onSuccess: permit => {
                            router.push({
                                pathname: '/(app)/(auth)/set-new-password',
                                params: { permitToken: permit.permitToken },
                            });
                        },
                        onError: handleFailure,
                    },
                );
                return;
            }

            // Успіх сам піднімає гард — `useVerifyEmail` кладе токени й
            // перемикає сесію, тож маршрут сюди не потрібен.
            verifyEmail.mutate({ email, code: submitted }, { onError: handleFailure });
        },
        [email, flow, handleFailure, isPending, verifyEmail, verifyReset],
    );

    const handleResend = useCallback(() => {
        if (resendSeconds > 0 || resendCode.isPending || !email) return;

        resendCode.mutate(
            { email },
            {
                // 204 навіть для неіснуючої адреси — ендпоінт не розкриває, хто
                // зареєстрований. Тож повідомляємо лише про надсилання запиту.
                onSuccess: () => {
                    setCode('');
                    setError(undefined);
                    setResendSeconds(OTP_RESEND_COOLDOWN_SECONDS);
                    ToastService.success(t('auth:email-verify.resent'));
                },
                onError: () => ToastService.error(t('common:states.error')),
            },
        );
    }, [email, resendCode, resendSeconds, t]);

    return {
        maskedEmail: maskEmail(email),
        code,
        setCode: handleChangeCode,
        error,
        isSubmitting: isPending,
        handleComplete,
        resendSeconds,
        canResend: resendSeconds <= 0 && !resendCode.isPending,
        handleResend,
    };
};
