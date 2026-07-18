import { useCallback, useState } from 'react';

import { router } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';

export const useSetNewPasswordScreen = () => {
    const { t } = useAppTranslation(['auth']);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = useCallback(() => {
        // TODO: POST /auth/reset-password once the API ships — mock success.
        ToastService.success(t('auth:set-new-password.success'));
        // Pop the whole reset flow (forgot-password → email-verify → here) so
        // "back" from sign-in can't re-enter stale screens.
        if (router.canGoBack()) {
            router.dismissTo('/(app)/(auth)/sign-in');
        } else {
            router.replace('/(app)/(auth)/sign-in');
        }
    }, [t]);

    return {
        password,
        setPassword,
        confirmPassword,
        setConfirmPassword,
        handleSubmit,
    };
};
