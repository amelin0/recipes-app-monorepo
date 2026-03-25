import type { Context } from 'hono'
import { FavoritesService } from '../../shared/services/index.ts'
import { success, error } from '../../shared/helpers/response.helper.ts'

export const ClientFavoritesController = {
  getAll: async (c: Context) => {
    try {
      const userId = c.get('userId')
      const language = c.get('language') || 'uk'
      const data = await FavoritesService.getByUser(userId, language)
      return success(c, data)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed to get favorites')
    }
  },

  add: async (c: Context) => {
    try {
      const userId = c.get('userId')
      const { recipe_id } = await c.req.json()
      if (!recipe_id) return error(c, 'recipe_id is required')
      const data = await FavoritesService.add(userId, recipe_id)
      return success(c, data, 201)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed to add favorite')
    }
  },

  remove: async (c: Context) => {
    try {
      const userId = c.get('userId')
      const recipeId = c.req.param('recipeId')
      await FavoritesService.remove(userId, recipeId)
      return success(c, null)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed to remove favorite')
    }
  },
}
