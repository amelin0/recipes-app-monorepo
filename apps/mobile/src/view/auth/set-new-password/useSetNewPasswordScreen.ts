import { useCallback, useMemo, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import { validatePassword } from '@/shared/constants';
import { ToastService } from '@/shared/services';
import { apiErrorCode, apiFieldErrors } from '@/shared/utils';
import { useAppTranslation } from '@/shared/utils/translations';
import { useSetNewPassword } from '@/state/domains/auth';

export const useSetNewPasswordScreen = () => {
    const { t } = useAppTranslation(['auth', 'common']);
    const { permitToken = '' } = useLocalSearchParams<{ permitToken?: string }>();
    const setNewPassword = useSetNewPassword();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [serverError, setServerError] = useState<string>();

    const passwordRule = useMemo(() => validatePassword(password), [password]);
    const mismatched = confirmPassword.length > 0 && password !== confirmPassword;

    const handleSubmit = useCallback(() => {
        setSubmitted(true);
        if (setNewPassword.isPending || passwordRule || password !== confirmPassword) return;

        if (!permitToken) {
            // Дозвіл живе недовго: якщо екран відкрили в обхід кроку з кодом
            // або застосунок перезапустили — починаємо з пошти заново.
            ToastService.error(t('auth:set-new-password.permit-expired'));
            router.replace('/(app)/(auth)/forgot-password');
            return;
        }

        setNewPassword.mutate(
            { permitToken, password, passwordConfirmation: confirmPassword },
            {
                // Успіх відкликає всі сесії, цю теж — тому фінал веде на вхід,
                // а не в застосунок.
                onSuccess: () => router.replace('/(app)/(auth)/password-changed'),
                onError: failure => {
                    if (apiErrorCode(failure) === 'auth.invalid-permit') {
                        ToastService.error(t('auth:set-new-password.permit-expired'));
                        router.replace('/(app)/(auth)/forgot-password');
                        return;
                    }

                    const fields = apiFieldErrors(failure);
                    setServerError(fields.password ?? fields.passwordConfirmation);
                    if (!fields.password && !fields.passwordConfirmation) {
                        ToastService.error(t('common:states.error'));
                    }
                },
            },
        );
    }, [confirmPassword, password, passwordRule, permitToken, setNewPassword, t]);

    return {
        password,
        setPassword: (value: string) => {
            setServerError(undefined);
            setPassword(value);
        },
        confirmPassword,
        setConfirmPassword,
        passwordError:
            serverError ?? (submitted && passwordRule ? t(`auth:password-rules.${passwordRule}`) : undefined),
        confirmError: mismatched ? t('auth:password-rules.mismatch') : undefined,
        isSubmitting: setNewPassword.isPending,
        handleSubmit,
    };
};
