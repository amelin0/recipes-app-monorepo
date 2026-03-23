import { Hono } from 'hono'
import { AdminUserController } from './user.controller.ts'

const userRoutes = new Hono()

userRoutes.get('/all', AdminUserController.getAll)

export { userRoutes }
