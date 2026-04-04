import { Hono } from 'hono'
import { AuthController } from './auth.controller.ts'

const authRoutes = new Hono()

authRoutes.post('/check-email', AuthController.checkEmail)
authRoutes.post('/login', AuthController.login)
authRoutes.post('/register', AuthController.register)

export { authRoutes }
