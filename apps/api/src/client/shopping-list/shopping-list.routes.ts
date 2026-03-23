import { Hono } from 'hono'
import { authMiddleware } from '../../shared/middleware/auth.middleware.ts'
import { ShoppingListController } from './shopping-list.controller.ts'

const shoppingListRoutes = new Hono()

shoppingListRoutes.use('*', authMiddleware)
shoppingListRoutes.get('/', ShoppingListController.getList)
shoppingListRoutes.post('/', ShoppingListController.addRecipe)
shoppingListRoutes.delete('/recipes/:id', ShoppingListController.removeRecipe)
shoppingListRoutes.patch('/items/:id/toggle', ShoppingListController.toggleItem)
shoppingListRoutes.delete('/clear', ShoppingListController.clear)

export { shoppingListRoutes }
