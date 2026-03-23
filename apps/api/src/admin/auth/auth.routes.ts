import { Hono } from 'hono'
import { AdminAuthController } from './auth.controller.ts'

const authRoutes = new Hono()

authRoutes.post('/login', AdminAuthController.login)

export { authRoutes }
