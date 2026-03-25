import { HttpService } from '@/shared/services'
import type { PaginatedNotifications } from './notifications.types'

export const NotificationsApi = {
  getAll: (page = 1, limit = 20) =>
    HttpService.get<PaginatedNotifications>(`/admin/notifications?page=${page}&limit=${limit}`),

  getUnreadCount: () =>
    HttpService.get<{ unread_count: number }>('/admin/notifications/unread-count'),

  markAllRead: () =>
    HttpService.post<null>('/admin/notifications/read-all'),
}
