import { useCallback, useState } from 'react';

import { router } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';

export const useSignUpScreen = () => {
    const { t } = useAppTranslation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSignUp = useCallback(() => {
        // TODO: POST /auth/register once the API ships — mock flow goes
        // straight to the email verification step.
        router.push({ pathname: '/(app)/(auth)/email-verify', params: { email } });
    }, [email]);

    const handleTermsOfService = useCallback(() => {
        // TODO: open the terms-of-service page once it exists.
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    const handlePrivacyPolicy = useCallback(() => {
        // TODO: open the privacy-policy page once it exists.
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    const handleSignIn = useCallback(() => {
        router.replace('/(app)/(auth)/sign-in');
    }, []);

    return {
        email,
        setEmail,
        password,
        setPassword,
        confirmPassword,
        setConfirmPassword,
        handleSignUp,
        handleTermsOfService,
        handlePrivacyPolicy,
        handleSignIn,
    };
};
