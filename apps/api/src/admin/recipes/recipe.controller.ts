import type { Context } from 'hono'
import { parse } from '@std/csv'
import { RecipeService } from '../../shared/services/index.ts'
import { success, error } from '../../shared/helpers/response.helper.ts'

export const AdminRecipeController = {
  create: async (c: Context) => {
    try {
      const userId = c.get('userId')
      const body = await c.req.json()

      if (!body.translations || !body.translations.length) {
        return error(c, 'translations are required')
      }
      if (!body.ingredients) body.ingredients = []
      if (!body.tag_ids) body.tag_ids = []

      const data = await RecipeService.create(userId, body)
      return success(c, data, 201)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to create recipe'
      return error(c, message)
    }
  },

  update: async (c: Context) => {
    try {
      const id = c.req.param('id')
      const body = await c.req.json()
      const data = await RecipeService.update(id, body)
      return success(c, data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to update recipe'
      return error(c, message)
    }
  },

  getAll: async (c: Context) => {
    try {
      const language = c.get('language')
      const { search, tags, min_proteins_g, min_calories, max_calories, page, limit } = c.req.query()
      const data = await RecipeService.getAll({
        search,
        tags: tags ? tags.split(',') : undefined,
        min_proteins_g: min_proteins_g ? Number(min_proteins_g) : undefined,
        min_calories: min_calories ? Number(min_calories) : undefined,
        max_calories: max_calories ? Number(max_calories) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
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

  // Tags
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

  createTag: async (c: Context) => {
    try {
      const { translations } = await c.req.json()
      if (!translations || !translations.length) {
        return error(c, 'translations are required')
      }
      const data = await RecipeService.createTag(translations)
      return success(c, data, 201)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to create tag'
      return error(c, message)
    }
  },

  // Ingredients
  getIngredients: async (c: Context) => {
    try {
      const language = c.get('language')
      const data = await RecipeService.getAllIngredients(language)
      return success(c, data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to get ingredients'
      return error(c, message)
    }
  },

  createIngredient: async (c: Context) => {
    try {
      const { translations } = await c.req.json()
      if (!translations || !translations.length) {
        return error(c, 'translations are required')
      }
      const data = await RecipeService.createIngredient(translations)
      return success(c, data, 201)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to create ingredient'
      return error(c, message)
    }
  },

  importCsv: async (c: Context) => {
    try {
      const userId = c.get('userId')
      const body = await c.req.parseBody()
      const file = body['file']

      if (!file || typeof file === 'string') {
        return error(c, 'CSV file is required')
      }

      const text = await file.text()
      const rows = parse(text, { skipFirstRow: true })

      const data = await RecipeService.importBatch(userId, rows as any[])
      return success(c, data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'CSV import failed'
      return error(c, message)
    }
  },

  deleteMany: async (c: Context) => {
    try {
      const { ids } = await c.req.json()
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return error(c, 'ids array is required')
      }
      const data = await RecipeService.deleteMany(ids)
      return success(c, data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to delete recipes'
      return error(c, message)
    }
  },

  getByIdFull: async (c: Context) => {
    try {
      const id = c.req.param('id')
      const data = await RecipeService.getByIdAllTranslations(id)
      return success(c, data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Recipe not found'
      return error(c, message, 404)
    }
  },
}
