import { Hono } from 'hono'
import { superAdminMiddleware } from '../../shared/middleware/auth.middleware.ts'
import { AdminTagController } from './tag.controller.ts'

const tagRoutes = new Hono()

// Named routes first (before /:id)
tagRoutes.get('/', AdminTagController.getAll)
tagRoutes.post('/', superAdminMiddleware, AdminTagController.create)
tagRoutes.post('/assign', superAdminMiddleware, AdminTagController.assignToRecipes)
tagRoutes.post('/remove', superAdminMiddleware, AdminTagController.removeFromRecipes)

// Parameterized routes last
tagRoutes.get('/:id', AdminTagController.getById)
tagRoutes.put('/:id', superAdminMiddleware, AdminTagController.update)
tagRoutes.delete('/:id', superAdminMiddleware, AdminTagController.delete)

export { tagRoutes }
