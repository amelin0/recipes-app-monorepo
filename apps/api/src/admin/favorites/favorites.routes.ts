import { Hono } from 'hono'
import { AdminFavoritesController } from './favorites.controller.ts'

const favoritesRoutes = new Hono()

favoritesRoutes.get('/top', AdminFavoritesController.getTop)
favoritesRoutes.get('/stats', AdminFavoritesController.getAllStats)

export { favoritesRoutes }
