import { Hono } from 'hono'
import { AdminUserController } from './user.controller.ts'

const userRoutes = new Hono()

userRoutes.get('/', AdminUserController.getAllPaginated)
userRoutes.get('/all', AdminUserController.getAll)
userRoutes.get('/stats', AdminUserController.getRegistrationStats)
userRoutes.get('/:id', AdminUserController.getById)
userRoutes.patch('/:id/block', AdminUserController.toggleBlock)

export { userRoutes }
