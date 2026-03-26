import { Hono } from 'hono'
import { superAdminMiddleware } from '../../shared/middleware/auth.middleware.ts'
import { AdminRecipeController } from './recipe.controller.ts'

const recipeRoutes = new Hono()

// List + Import (before /:id to avoid param capture)
recipeRoutes.get('/', AdminRecipeController.getAll)
recipeRoutes.post('/', superAdminMiddleware, AdminRecipeController.create)
recipeRoutes.post('/import', superAdminMiddleware, AdminRecipeController.importCsv)

// Tags
recipeRoutes.get('/tags/all', AdminRecipeController.getTags)
recipeRoutes.post('/tags', superAdminMiddleware, AdminRecipeController.createTag)

// Ingredients
recipeRoutes.get('/ingredients/all', AdminRecipeController.getIngredients)
recipeRoutes.post('/ingredients', superAdminMiddleware, AdminRecipeController.createIngredient)

// Single recipe (after named routes)
recipeRoutes.get('/:id', AdminRecipeController.getById)
recipeRoutes.get('/:id/full', AdminRecipeController.getByIdFull)
recipeRoutes.put('/:id', superAdminMiddleware, AdminRecipeController.update)

export { recipeRoutes }
