import { useCallback } from 'react';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';

export const useAccountDeletedScreen = () => {
    const { t } = useAppTranslation(['profile', 'common']);
    const reset = useStore(state => state.reset);

    const handleRestore = useCallback(() => {
        // TODO: POST /me/restore once the API ships.
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    return { handleRestore, handleLogout: reset };
};
