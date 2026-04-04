import type { Context } from 'hono'
import { TagService } from '../../shared/services/index.ts'
import { success, error } from '../../shared/helpers/response.helper.ts'

export const AdminTagController = {
  getAll: async (c: Context) => {
    try {
      const [tags, counts] = await Promise.all([
        TagService.getAll(),
        TagService.getRecipeCounts(),
      ])
      const data = tags.map((t: any) => ({
        ...t,
        recipe_count: counts[t.id] || 0,
      }))
      return success(c, data)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed to get tags')
    }
  },

  getById: async (c: Context) => {
    try {
      const id = c.req.param('id')
      const data = await TagService.getById(id)
      return success(c, data)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Tag not found', 404)
    }
  },

  create: async (c: Context) => {
    try {
      const { translations } = await c.req.json()
      if (!translations?.length) return error(c, 'translations are required')
      const data = await TagService.create(translations)
      return success(c, data, 201)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed to create tag')
    }
  },

  update: async (c: Context) => {
    try {
      const id = c.req.param('id')
      const { translations } = await c.req.json()
      if (!translations?.length) return error(c, 'translations are required')
      const data = await TagService.update(id, translations)
      return success(c, data)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed to update tag')
    }
  },

  delete: async (c: Context) => {
    try {
      const id = c.req.param('id')
      const data = await TagService.delete(id)
      return success(c, data)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed to delete tag')
    }
  },

  assignToRecipes: async (c: Context) => {
    try {
      const { recipe_ids, tag_ids } = await c.req.json()
      if (!recipe_ids?.length || !tag_ids?.length) {
        return error(c, 'recipe_ids and tag_ids are required')
      }
      const data = await TagService.assignToRecipes(recipe_ids, tag_ids)
      return success(c, data)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed to assign tags')
    }
  },

  removeFromRecipes: async (c: Context) => {
    try {
      const { recipe_ids, tag_ids } = await c.req.json()
      if (!recipe_ids?.length || !tag_ids?.length) {
        return error(c, 'recipe_ids and tag_ids are required')
      }
      const data = await TagService.removeFromRecipes(recipe_ids, tag_ids)
      return success(c, data)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed to remove tags')
    }
  },
}
