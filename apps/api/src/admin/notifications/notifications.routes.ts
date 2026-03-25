import { Hono } from 'hono'
import { AdminNotificationsController } from './notifications.controller.ts'

const notificationsRoutes = new Hono()

notificationsRoutes.get('/', AdminNotificationsController.getAll)
notificationsRoutes.get('/unread-count', AdminNotificationsController.getUnreadCount)
notificationsRoutes.post('/read-all', AdminNotificationsController.markAllRead)

export { notificationsRoutes }
