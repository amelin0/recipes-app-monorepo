import { useCallback, useMemo, useState } from 'react';

import { router } from 'expo-router';

import { ToastService } from '@/shared/services';
import { validatePassword } from '@/shared/constants';
import { apiErrorCode, apiFieldErrors } from '@/shared/utils';
import { useAppTranslation } from '@/shared/utils/translations';
import { useSignUp } from '@/state/domains/auth';

export const useSignUpScreen = () => {
    const { t } = useAppTranslation(['auth', 'common']);
    const signUp = useSignUp();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // Правила пароля показуємо після першої спроби, а не під час набору:
    // «замало символів» на другому символі — це докір, а не підказка.
    const [submitted, setSubmitted] = useState(false);
    const [serverError, setServerError] = useState<{ email?: string; password?: string }>({});

    const passwordRule = useMemo(() => validatePassword(password), [password]);

    const handleChangeEmail = useCallback((value: string) => {
        setServerError(prev => ({ ...prev, email: undefined }));
        setEmail(value);
    }, []);

    const handleChangePassword = useCallback((value: string) => {
        setServerError(prev => ({ ...prev, password: undefined }));
        setPassword(value);
    }, []);

    const handleSignUp = useCallback(() => {
        setSubmitted(true);
        if (signUp.isPending || !email.trim() || passwordRule) return;

        const trimmedEmail = email.trim();

        signUp.mutate(
            { email: trimmedEmail, password },
            {
                onSuccess: () => {
                    // 201 несе порожнє тіло — сесія починається лише після коду.
                    router.push({ pathname: '/(app)/(auth)/email-verify', params: { email: trimmedEmail } });
                },
                onError: error => {
                    if (apiErrorCode(error) === 'auth.email-taken') {
                        setServerError({ email: t('auth:sign-up.email-taken') });
                        return;
                    }

                    const fields = apiFieldErrors(error);
                    if (fields.email || fields.password) {
                        setServerError({ email: fields.email, password: fields.password });
                        return;
                    }

                    ToastService.error(t('common:states.error'));
                },
            },
        );
    }, [email, password, passwordRule, signUp, t]);

    const handleComingSoon = useCallback(() => {
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    const handleSignIn = useCallback(() => {
        // Sign-up is normally pushed from sign-in — going back avoids stacking
        // a duplicate sign-in entry; replace covers deep-link entry.
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(app)/(auth)/sign-in');
        }
    }, []);

    return {
        email,
        setEmail: handleChangeEmail,
        password,
        setPassword: handleChangePassword,
        emailError: serverError.email,
        passwordError:
            serverError.password ?? (submitted && passwordRule ? t(`auth:password-rules.${passwordRule}`) : undefined),
        isSubmitting: signUp.isPending,
        handleSignUp,
        // TODO: сторінки умов і політики ще не існує.
        handleTermsOfService: handleComingSoon,
        handlePrivacyPolicy: handleComingSoon,
        // TODO: POST /auth/oauth — потрібні нативні SDK Apple/Google.
        handleAppleSignUp: handleComingSoon,
        handleGoogleSignUp: handleComingSoon,
        handleSignIn,
    };
};
