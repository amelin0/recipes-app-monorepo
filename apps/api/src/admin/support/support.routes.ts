import { Hono } from 'hono'
import { AdminSupportController } from './support.controller.ts'

const supportRoutes = new Hono()

supportRoutes.get('/', AdminSupportController.getAll)
supportRoutes.get('/:id', AdminSupportController.getById)
supportRoutes.patch('/:id/status', AdminSupportController.updateStatus)

export { supportRoutes }
