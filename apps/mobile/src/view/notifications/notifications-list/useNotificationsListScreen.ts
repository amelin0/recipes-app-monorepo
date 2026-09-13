import { useCallback, useMemo, useState } from 'react';

import { router } from 'expo-router';

import type { AppNotification } from '@/data';
import { formatFullDate, toIsoDay } from '@/shared/helpers';
import { useAppTranslation } from '@/shared/utils/translations';
import {
    useGetNotifications,
    useMarkAllNotificationsRead,
    useMarkNotificationRead,
    useUnreadCount,
} from '@/state/domains/notification';

import type { NotificationGroup } from '../notifications.constants';

type TabKey = 'all' | 'unread';

export const useNotificationsListScreen = () => {
    const { t } = useAppTranslation(['notifications']);

    const [activeTab, setActiveTab] = useState<TabKey>('all');

    const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetNotifications(
        activeTab === 'unread',
    );
    const { data: unread } = useUnreadCount();
    const markRead = useMarkNotificationRead();
    const markAllRead = useMarkAllNotificationsRead();

    const notifications = useMemo(() => data?.pages.flatMap(page => page.data) ?? [], [data]);

    /**
     * Grouped by the device's own calendar day.
     *
     * The server sends instants and says so explicitly: only the client knows
     * which day «22:30 UTC» was for the person reading it.
     */
    const groups = useMemo<NotificationGroup[]>(() => {
        const today = toIsoDay();
        const yesterday = toIsoDay(new Date(Date.now() - 86_400_000));

        const byDay = new Map<string, AppNotification[]>();
        notifications.forEach(notification => {
            const day = toIsoDay(new Date(notification.createdAt));
            const list = byDay.get(day) ?? [];
            list.push(notification);
            byDay.set(day, list);
        });

        return [...byDay.entries()].map(([day, items]) => ({
            key: day,
            label:
                day === today
                    ? t('notifications:groups.today')
                    : day === yesterday
                      ? t('notifications:groups.yesterday')
                      : formatFullDate(new Date(`${day}T00:00:00`)),
            items,
        }));
    }, [notifications, t]);

    const handleOpen = useCallback(
        (id: string) => {
            const notification = notifications.find(item => item.id === id);
            // Уже прочитане не позначаємо повторно — це зайвий запит і зайве
            // скидання кешу списку прямо перед переходом.
            if (notification && !notification.isRead) markRead.mutate(id);
            router.push({ pathname: '/(app)/notification-detail', params: { id } });
        },
        [markRead, notifications],
    );

    return {
        tabs: [
            { key: 'all', label: t('notifications:tabs.all') },
            { key: 'unread', label: t('notifications:tabs.unread') },
        ],
        activeTab,
        setActiveTab: (key: string) => setActiveTab(key === 'unread' ? 'unread' : 'all'),
        groups,
        isLoading,
        isError,
        isEmpty: !isLoading && !isError && groups.length === 0,
        handleRetry: refetch,
        handleEndReached: () => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
        },
        hasUnread: (unread?.count ?? 0) > 0,
        handleReadAll: () => markAllRead.mutate(),
        handleOpen,
    };
};
