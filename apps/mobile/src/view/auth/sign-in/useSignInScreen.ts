import { useCallback, useState } from 'react';

import { router } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';

export const useSignInScreen = () => {
    const { t } = useAppTranslation();
    const switchAuthenticated = useStore(state => state.switchAuthenticatedAction);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignIn = useCallback(() => {
        // TODO: POST /auth/login once the API ships — mock success for now.
        switchAuthenticated(true);
    }, [switchAuthenticated]);

    const handleForgotPassword = useCallback(() => {
        router.push('/(app)/(auth)/forgot-password');
    }, []);

    const handleSignUp = useCallback(() => {
        router.push('/(app)/(auth)/sign-up');
    }, []);

    const handleAppleSignIn = useCallback(() => {
        // TODO: Apple OAuth once the API ships.
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    const handleGoogleSignIn = useCallback(() => {
        // TODO: Google OAuth once the API ships.
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    return {
        email,
        setEmail,
        password,
        setPassword,
        handleSignIn,
        handleForgotPassword,
        handleSignUp,
        handleAppleSignIn,
        handleGoogleSignIn,
    };
};
