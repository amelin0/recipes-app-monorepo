import { useCallback } from 'react';

import { router } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useSignOut } from '@/state/domains/auth';
import { useCancelAccountDeletion } from '@/state/domains/user';

export const useAccountRestoreFailedScreen = () => {
    const { t } = useAppTranslation(['profile', 'common']);
    const cancelDeletion = useCancelAccountDeletion();
    const signOut = useSignOut();

    const handleRetry = useCallback(() => {
        if (cancelDeletion.isPending) return;

        cancelDeletion.mutate(undefined, {
            onSuccess: () => router.replace('/(app)/account-restored'),
            onError: () => ToastService.error(t('common:states.error')),
        });
    }, [cancelDeletion, t]);

    const handleSupport = useCallback(() => {
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    return {
        handleRetry,
        isRetrying: cancelDeletion.isPending,
        handleSupport,
        handleLogout: () => void signOut(),
    };
};
