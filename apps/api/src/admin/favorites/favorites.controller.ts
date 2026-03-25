import type { Context } from 'hono'
import { FavoritesService } from '../../shared/services/index.ts'
import { success, error } from '../../shared/helpers/response.helper.ts'

export const AdminFavoritesController = {
  getTop: async (c: Context) => {
    try {
      const language = c.get('language') || 'uk'
      const { limit } = c.req.query()
      const data = await FavoritesService.getTopFavorited(limit ? Number(limit) : 5, language)
      return success(c, data)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed to get top favorites')
    }
  },

  getAllStats: async (c: Context) => {
    try {
      const language = c.get('language') || 'uk'
      const { page, limit } = c.req.query()
      const data = await FavoritesService.getAllStats(
        page ? Number(page) : 1,
        limit ? Number(limit) : 20,
        language,
      )
      return success(c, data)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed to get favorite stats')
    }
  },
}
