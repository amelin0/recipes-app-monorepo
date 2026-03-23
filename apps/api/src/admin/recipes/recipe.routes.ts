import { Hono } from 'hono'
import { superAdminMiddleware } from '../../shared/middleware/auth.middleware.ts'
import { AdminRecipeController } from './recipe.controller.ts'

const recipeRoutes = new Hono()

// All recipe mutation routes require SUPER_ADMIN
recipeRoutes.post('/', superAdminMiddleware, AdminRecipeController.create)
recipeRoutes.put('/:id', superAdminMiddleware, AdminRecipeController.update)
recipeRoutes.get('/', AdminRecipeController.getAll)
recipeRoutes.get('/:id', AdminRecipeController.getById)

// Tags
recipeRoutes.get('/tags/all', AdminRecipeController.getTags)
recipeRoutes.post('/tags', superAdminMiddleware, AdminRecipeController.createTag)

// Ingredients
recipeRoutes.get('/ingredients/all', AdminRecipeController.getIngredients)
recipeRoutes.post('/ingredients', superAdminMiddleware, AdminRecipeController.createIngredient)

export { recipeRoutes }
