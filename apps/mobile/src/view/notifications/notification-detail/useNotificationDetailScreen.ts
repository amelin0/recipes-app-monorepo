import { useCallback, useMemo } from 'react';

import { router, useLocalSearchParams, type Href } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useGetNotifications } from '@/state/domains/notification';

export const useNotificationDetailScreen = () => {
    const { t } = useAppTranslation(['notifications', 'common']);
    const { id } = useLocalSearchParams<{ id?: string }>();

    /**
     * Read from the list the user came through — the API has no route for a
     * single notification (`handoff/mobile-ui-review.md` §4.3), so a push
     * deep-link that lands here cold finds nothing.
     */
    const { data, isLoading, isError, refetch } = useGetNotifications();

    const item = useMemo(
        () => data?.pages.flatMap(page => page.data).find(notification => notification.id === id),
        [data, id],
    );

    const handleAction = useCallback(() => {
        if (!item?.actionRoute) return;

        // Маршрут приходить рядком, як його розуміє застосунок. Невідомий —
        // не ведемо в нікуди, а кажемо, що дія ще не підтримується.
        if (!item.actionRoute.startsWith('/')) {
            ToastService.info(t('common:states.coming-soon'));
            return;
        }
        router.push(item.actionRoute as Href);
    }, [item, t]);

    return {
        item,
        isLoading,
        isError,
        handleRetry: refetch,
        handleAction,
    };
};
