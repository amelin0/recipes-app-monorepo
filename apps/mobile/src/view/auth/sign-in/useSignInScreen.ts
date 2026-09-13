import { useCallback, useState } from 'react';

import { router } from 'expo-router';

import { useSignIn } from '@/state/domains/auth';
import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';

export const useSignInScreen = () => {
    const { t } = useAppTranslation(['auth', 'common']);
    const signIn = useSignIn();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignIn = useCallback(() => {
        if (signIn.isPending) return;

        signIn.mutate(
            { email: email.trim(), password },
            {
                // Той самий перехід, що й після підтвердження пошти: гард
                // відкриває захищену групу на вкладках, а куди саме пускати —
                // вирішує кореневий `/` (анкета, відновлення чи головна).
                onSuccess: () => router.replace('/'),
                onError: (error: unknown) => {
                    const failure = error as { statusCode?: number; code?: string } | undefined;

                    // Пошта ще не підтверджена — сервер щойно надіслав новий
                    // код, тож ведемо одразу на екран вводу коду.
                    if (failure?.code === 'auth.email-not-verified') {
                        router.push({
                            pathname: '/(app)/(auth)/email-verify',
                            params: { email: email.trim() },
                        });
                        return;
                    }

                    ToastService.error(
                        failure?.statusCode === 401 ? t('auth:sign-in.invalid-credentials') : t('common:states.error'),
                    );
                },
            },
        );
    }, [email, password, signIn, t]);

    const handleForgotPassword = useCallback(() => {
        router.push('/(app)/(auth)/forgot-password');
    }, []);

    const handleSignUp = useCallback(() => {
        router.push('/(app)/(auth)/sign-up');
    }, []);

    const handleAppleSignIn = useCallback(() => {
        // TODO: POST /auth/oauth — потрібен нативний Apple Sign In SDK.
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    const handleGoogleSignIn = useCallback(() => {
        // TODO: POST /auth/oauth — потрібен нативний Google Sign In SDK.
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    return {
        email,
        setEmail,
        password,
        setPassword,
        isSubmitting: signIn.isPending,
        handleSignIn,
        handleForgotPassword,
        handleSignUp,
        handleAppleSignIn,
        handleGoogleSignIn,
    };
};
