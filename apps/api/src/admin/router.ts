import { Hono } from 'hono'
import { authMiddleware, adminMiddleware } from '../shared/middleware/auth.middleware.ts'
import { authRoutes } from './auth/index.ts'
import { userRoutes } from './users/index.ts'

const adminRouter = new Hono()

// Auth routes (no middleware — login is public)
adminRouter.route('/auth', authRoutes)

// Protected admin routes
adminRouter.use('*', authMiddleware, adminMiddleware)
adminRouter.route('/users', userRoutes)

export { adminRouter }
