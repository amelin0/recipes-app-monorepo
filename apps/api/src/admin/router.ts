import { Hono } from 'hono'
import { authMiddleware, adminMiddleware } from '../shared/middleware/auth.middleware.ts'
import { authRoutes } from './auth/index.ts'
import { userRoutes } from './users/index.ts'
import { recipeRoutes } from './recipes/index.ts'
import { favoritesRoutes } from './favorites/index.ts'
import { supportRoutes } from './support/index.ts'
import { notificationsRoutes } from './notifications/index.ts'
import { languageRoutes } from './languages/index.ts'
import { uploadRoutes } from './upload/index.ts'
import { productRoutes } from './products/index.ts'

const adminRouter = new Hono()

// Auth routes (no middleware — login is public)
adminRouter.route('/auth', authRoutes)

// Protected admin routes
adminRouter.use('*', authMiddleware, adminMiddleware)
adminRouter.route('/users', userRoutes)
adminRouter.route('/recipes', recipeRoutes)
adminRouter.route('/favorites', favoritesRoutes)
adminRouter.route('/support-messages', supportRoutes)
adminRouter.route('/notifications', notificationsRoutes)
adminRouter.route('/languages', languageRoutes)
adminRouter.route('/upload', uploadRoutes)
adminRouter.route('/products', productRoutes)

export { adminRouter }
