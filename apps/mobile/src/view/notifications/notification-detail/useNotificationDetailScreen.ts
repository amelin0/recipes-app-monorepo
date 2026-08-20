import { useCallback, useMemo } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';

import { MOCK_NOTIFICATIONS } from '../notifications.constants';

export const useNotificationDetailScreen = () => {
    const { t } = useAppTranslation(['notifications', 'common']);
    const { id } = useLocalSearchParams<{ id?: string }>();

    const item = useMemo(
        () => MOCK_NOTIFICATIONS.flatMap(group => group.items).find(notification => notification.id === id),
        [id],
    );

    const handleAction = useCallback(() => {
        if (item?.action === 'report') {
            router.push('/(app)/(tabs)/progress');
            return;
        }
        if (item?.action === 'subscription') {
            router.push('/(app)/paywall');
            return;
        }
        // TODO: the update action opens the store listing once the app ships.
        ToastService.info(t('common:states.coming-soon'));
    }, [item, t]);

    return { item, handleAction };
};
