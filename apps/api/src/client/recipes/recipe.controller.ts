import type { Context } from 'hono'
import { RecipeService } from '../../shared/services/index.ts'
import { success, error } from '../../shared/helpers/response.helper.ts'

export const RecipeController = {
  getAll: async (c: Context) => {
    try {
      const language = c.get('language')
      const q = c.req.query()
      const data = await RecipeService.getAll({
        search: q.search,
        tags: q.tags ? q.tags.split(',') : undefined,
        min_proteins_g: q.min_proteins_g ? Number(q.min_proteins_g) : undefined,
        min_carbs_g: q.min_carbs_g ? Number(q.min_carbs_g) : undefined,
        min_fats_g: q.min_fats_g ? Number(q.min_fats_g) : undefined,
        min_calories: q.min_calories ? Number(q.min_calories) : undefined,
        max_calories: q.max_calories ? Number(q.max_calories) : undefined,
        page: q.page ? Number(q.page) : undefined,
        limit: q.limit ? Number(q.limit) : undefined,
      }, language)
      return success(c, data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to get recipes'
      return error(c, message)
    }
  },

  getById: async (c: Context) => {
    try {
      const id = c.req.param('id')
      const language = c.get('language')
      const data = await RecipeService.getById(id, language)
      return success(c, data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Recipe not found'
      return error(c, message, 404)
    }
  },

  getTags: async (c: Context) => {
    try {
      const language = c.get('language')
      const data = await RecipeService.getAllTags(language)
      return success(c, data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to get tags'
      return error(c, message)
    }
  },
}
