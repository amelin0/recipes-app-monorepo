import type { Context } from 'hono'
import { ProductService } from '../../shared/services/index.ts'
import { success, error } from '../../shared/helpers/response.helper.ts'

export const ClientProductController = {
  search: async (c: Context) => {
    try {
      const language = c.get('language') || 'en'
      const { q, page, limit } = c.req.query()
      if (!q) return error(c, 'Search query (q) is required')
      const data = await ProductService.search(q, language, page ? Number(page) : 1, limit ? Number(limit) : 20)
      return success(c, data)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Search failed')
    }
  },

  createCustom: async (c: Context) => {
    try {
      const userId = c.get('userId')
      const language = c.get('language') || 'en'
      const body = await c.req.json()
      if (!body.name) return error(c, 'name is required')
      if (body.proteins_per_100g == null || body.carbs_per_100g == null || body.fats_per_100g == null) {
        return error(c, 'proteins_per_100g, carbs_per_100g, fats_per_100g are required')
      }
      const data = await ProductService.createCustom(userId, language, body)
      return success(c, data, 201)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed to create product')
    }
  },
}
