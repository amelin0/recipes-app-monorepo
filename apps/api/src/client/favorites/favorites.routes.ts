import { Hono } from 'hono'
import { ClientFavoritesController } from './favorites.controller.ts'

const favoritesRoutes = new Hono()

favoritesRoutes.get('/', ClientFavoritesController.getAll)
favoritesRoutes.post('/', ClientFavoritesController.add)
favoritesRoutes.delete('/:recipeId', ClientFavoritesController.remove)

export { favoritesRoutes }
