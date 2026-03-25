import type { Context } from 'hono'
import { NotificationService } from '../../shared/services/index.ts'
import { success, error } from '../../shared/helpers/response.helper.ts'

export const AdminNotificationsController = {
  getAll: async (c: Context) => {
    try {
      const { page, limit } = c.req.query()
      const data = await NotificationService.getAll(page ? Number(page) : 1, limit ? Number(limit) : 20)
      return success(c, data)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed to get notifications')
    }
  },

  getUnreadCount: async (c: Context) => {
    try {
      const count = await NotificationService.getUnreadCount()
      return success(c, { unread_count: count })
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed to get unread count')
    }
  },

  markAllRead: async (c: Context) => {
    try {
      await NotificationService.markAllRead()
      return success(c, null)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed to mark as read')
    }
  },
}
