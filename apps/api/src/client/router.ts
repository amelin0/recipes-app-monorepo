import { Hono } from 'hono'
import { authRoutes } from './auth/index.ts'
import { userRoutes } from './users/index.ts'
import { nutritionRoutes } from './nutrition/index.ts'

const clientRouter = new Hono()

clientRouter.route('/auth', authRoutes)
clientRouter.route('/users', userRoutes)
clientRouter.route('/nutrition', nutritionRoutes)

export { clientRouter }
