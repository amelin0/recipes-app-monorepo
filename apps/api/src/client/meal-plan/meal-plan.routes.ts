import { Hono } from 'hono'
import { authMiddleware } from '../../shared/middleware/auth.middleware.ts'
import { MealPlanController } from './meal-plan.controller.ts'

const mealPlanRoutes = new Hono()

mealPlanRoutes.use('*', authMiddleware)
mealPlanRoutes.get('/week', MealPlanController.getWeek)
mealPlanRoutes.get('/today', MealPlanController.getToday)
mealPlanRoutes.get('/day/:day', MealPlanController.getDay)
mealPlanRoutes.post('/', MealPlanController.addItem)
mealPlanRoutes.delete('/items/:id', MealPlanController.removeItem)
mealPlanRoutes.delete('/day/:day', MealPlanController.clearDay)
mealPlanRoutes.post('/copy-day', MealPlanController.copyDay)
mealPlanRoutes.post('/day/:day/to-shopping-list', MealPlanController.dayToShoppingList)

export { mealPlanRoutes }
