import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';

import { NotificationApi } from '@/data';
import { notificationKeys, queryClient, Queries } from '@/shared/services';
import { useStore } from '@/state';

const PAGE_SIZE = 20;

export const useGetNotifications = (unreadOnly = false) => {
    const isAuthenticated = useStore(state => state.isAuthenticated);

    return useInfiniteQuery({
        queryKey: notificationKeys.list(unreadOnly),
        queryFn: ({ pageParam }) => NotificationApi.getNotifications({ unreadOnly, page: pageParam, limit: PAGE_SIZE }),
        initialPageParam: 1,
        getNextPageParam: last => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
        enabled: isAuthenticated,
    });
};

/** The badge on the home header. */
export const useUnreadCount = () => {
    const isAuthenticated = useStore(state => state.isAuthenticated);

    return useQuery({
        queryKey: notificationKeys.unreadCount(),
        queryFn: () => NotificationApi.getUnreadCount(),
        enabled: isAuthenticated,
        staleTime: 60_000,
    });
};

/**
 * Reading one changes the badge and the «Непрочитані» cut, so both go —
 * the list cannot simply drop the flag locally without the count drifting.
 */
const invalidateNotifications = () => {
    queryClient.invalidateQueries({ queryKey: [Queries.Notifications] });
    queryClient.invalidateQueries({ queryKey: [Queries.NotificationsUnread] });
};

export const useMarkNotificationRead = () =>
    useMutation({
        mutationFn: (id: string) => NotificationApi.markRead(id),
        onSuccess: invalidateNotifications,
    });

export const useMarkAllNotificationsRead = () =>
    useMutation({
        mutationFn: () => NotificationApi.markAllRead(),
        onSuccess: invalidateNotifications,
    });
