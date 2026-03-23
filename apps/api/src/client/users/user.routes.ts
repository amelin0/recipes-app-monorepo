import { Hono } from 'hono'
import { authMiddleware } from '../../shared/middleware/auth.middleware.ts'
import { UserController } from './user.controller.ts'

const userRoutes = new Hono()

userRoutes.use('*', authMiddleware)
userRoutes.get('/me', UserController.getMe)
userRoutes.post('/language', UserController.updateLanguage)
userRoutes.post('/metric-system', UserController.updateMetricSystem)
userRoutes.post('/weight', UserController.updateWeight)
userRoutes.get('/weight/history', UserController.getWeightHistory)

export { userRoutes }
