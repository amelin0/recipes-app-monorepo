import type { Context } from 'hono'
import { ProductService } from '../../shared/services/index.ts'
import { success, error } from '../../shared/helpers/response.helper.ts'

export const AdminProductController = {
  getAll: async (c: Context) => {
    try {
      const language = c.get('language') || 'en'
      const { search, type, page, limit } = c.req.query()
      const data = await ProductService.getAll({
        search: search || undefined,
        type: type || undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      }, language)
      return success(c, data)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed to get products')
    }
  },

  getById: async (c: Context) => {
    try {
      const id = c.req.param('id')
      const data = await ProductService.getById(id)
      return success(c, data)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Product not found', 404)
    }
  },

  update: async (c: Context) => {
    try {
      const id = c.req.param('id')
      const body = await c.req.json()
      const { calories_per_100g, proteins_per_100g, carbs_per_100g, fats_per_100g, translations } = body
      if (!Array.isArray(translations)) return error(c, 'translations must be an array')
      const data = await ProductService.update(id, {
        calories_per_100g,
        proteins_per_100g,
        carbs_per_100g,
        fats_per_100g,
        translations,
      })
      return success(c, data)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed to update product')
    }
  },

  verify: async (c: Context) => {
    try {
      const id = c.req.param('id')
      const { is_verified } = await c.req.json()
      if (typeof is_verified !== 'boolean') return error(c, 'is_verified must be boolean')
      const data = await ProductService.verify(id, is_verified)
      return success(c, data)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed to verify product')
    }
  },
}
