import { HttpService } from '@/shared/services';

import type { NotificationsPage, NotificationsQuery, UnreadCount } from './notification.types';

const ENDPOINTS = {
    list: '/notifications',
    unreadCount: '/notifications/unread-count',
    readAll: '/notifications/read-all',
    read: (id: string) => `/notifications/${id}/read`,
} as const;

export const NotificationApi = {
    getNotifications: (query: NotificationsQuery = {}) =>
        HttpService.get<NotificationsPage>(ENDPOINTS.list, { params: query }),

    /** Drives the badge on the home header. */
    getUnreadCount: () => HttpService.get<UnreadCount>(ENDPOINTS.unreadCount),

    markRead: (id: string) => HttpService.put<void>(ENDPOINTS.read(id)),

    markAllRead: () => HttpService.post<void>(ENDPOINTS.readAll),
};
