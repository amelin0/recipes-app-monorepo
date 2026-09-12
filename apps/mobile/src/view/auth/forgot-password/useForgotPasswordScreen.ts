import { useCallback, useState } from 'react';

import { router } from 'expo-router';

import { ToastService } from '@/shared/services';
import { apiFieldErrors } from '@/shared/utils';
import { useAppTranslation } from '@/shared/utils/translations';
import { useRequestPasswordReset } from '@/state/domains/auth';

export const useForgotPasswordScreen = () => {
    const { t } = useAppTranslation(['auth', 'common']);
    const requestReset = useRequestPasswordReset();

    const [email, setEmail] = useState('');
    const [error, setError] = useState<string>();

    const handleChangeEmail = useCallback((value: string) => {
        setError(undefined);
        setEmail(value);
    }, []);

    const handleSubmit = useCallback(() => {
        const trimmed = email.trim();
        if (requestReset.isPending || !trimmed) return;

        requestReset.mutate(
            { email: trimmed },
            {
                // Завжди 204 — навіть для адреси без акаунта. Тож переходимо
                // далі беззастережно: інакше екран став би способом дізнатись,
                // хто в нас зареєстрований.
                onSuccess: () => {
                    router.push({
                        pathname: '/(app)/(auth)/email-verify',
                        params: { email: trimmed, flow: 'password-reset' },
                    });
                },
                onError: failure => {
                    const fields = apiFieldErrors(failure);
                    if (fields.email) {
                        setError(fields.email);
                        return;
                    }
                    ToastService.error(t('common:states.error'));
                },
            },
        );
    }, [email, requestReset, t]);

    return {
        email,
        setEmail: handleChangeEmail,
        error,
        isSubmitting: requestReset.isPending,
        canSubmit: email.trim().length > 0,
        handleSubmit,
    };
};
