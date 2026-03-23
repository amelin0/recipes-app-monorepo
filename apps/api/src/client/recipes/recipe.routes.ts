import { Hono } from 'hono'
import { authMiddleware } from '../../shared/middleware/auth.middleware.ts'
import { RecipeController } from './recipe.controller.ts'

const recipeRoutes = new Hono()

recipeRoutes.use('*', authMiddleware)
recipeRoutes.get('/', RecipeController.getAll)
recipeRoutes.get('/tags', RecipeController.getTags)
recipeRoutes.get('/:id', RecipeController.getById)

export { recipeRoutes }
