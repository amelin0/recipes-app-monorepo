import { useCallback } from 'react';

import { router } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';

export const useAccountRestoreFailedScreen = () => {
    const { t } = useAppTranslation(['profile', 'common']);
    const reset = useStore(state => state.reset);

    const handleRetry = useCallback(() => {
        // TODO: POST /me/restore once the API ships — mock success for now.
        router.replace('/(app)/account-restored');
    }, []);

    const handleSupport = useCallback(() => {
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    return { handleRetry, handleSupport, handleLogout: reset };
};
