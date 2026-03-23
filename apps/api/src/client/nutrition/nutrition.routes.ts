import { Hono } from 'hono'
import { authMiddleware } from '../../shared/middleware/auth.middleware.ts'
import { NutritionController } from './nutrition.controller.ts'

const nutritionRoutes = new Hono()

nutritionRoutes.use('*', authMiddleware)
nutritionRoutes.post('/goal', NutritionController.setGoal)
nutritionRoutes.get('/daily', NutritionController.getDaily)

export { nutritionRoutes }
