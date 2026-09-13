import { useCallback } from 'react';

import { router } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useSignOut } from '@/state/domains/auth';
import { useCancelAccountDeletion } from '@/state/domains/user';

export const useAccountDeletedScreen = () => {
    const { t } = useAppTranslation(['common']);
    const cancelDeletion = useCancelAccountDeletion();
    const signOut = useSignOut();

    const handleRestore = useCallback(() => {
        if (cancelDeletion.isPending) return;

        cancelDeletion.mutate(undefined, {
            onSuccess: () => router.replace('/(app)/account-restored'),
            // 404 «нічого скасовувати» теж веде на екран невдачі: обидва
            // означають, що після цього натискання акаунт не відновлено.
            onError: () => {
                ToastService.error(t('common:states.error'));
                router.replace('/(app)/account-restore-failed');
            },
        });
    }, [cancelDeletion, t]);

    return { handleRestore, isRestoring: cancelDeletion.isPending, handleLogout: () => void signOut() };
};
