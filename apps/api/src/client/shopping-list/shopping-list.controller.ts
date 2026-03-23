import type { Context } from 'hono'
import { ShoppingListService } from '../../shared/services/index.ts'
import { success, error } from '../../shared/helpers/response.helper.ts'

export const ShoppingListController = {
  getList: async (c: Context) => {
    try {
      const userId = c.get('userId')
      const language = c.get('language')
      const data = await ShoppingListService.getList(userId, language)
      return success(c, data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to get shopping list'
      return error(c, message)
    }
  },

  addRecipe: async (c: Context) => {
    try {
      const userId = c.get('userId')
      const { recipe_id, servings } = await c.req.json()
      if (!recipe_id) return error(c, 'recipe_id is required')
      const data = await ShoppingListService.addRecipe(userId, recipe_id, servings || 1)
      return success(c, data, 201)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to add recipe'
      return error(c, message)
    }
  },

  removeRecipe: async (c: Context) => {
    try {
      const userId = c.get('userId')
      const id = c.req.param('id')
      const data = await ShoppingListService.removeRecipe(userId, id)
      return success(c, data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to remove recipe'
      return error(c, message)
    }
  },

  toggleItem: async (c: Context) => {
    try {
      const userId = c.get('userId')
      const id = c.req.param('id')
      const data = await ShoppingListService.toggleItem(userId, id)
      return success(c, data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to toggle item'
      return error(c, message)
    }
  },

  clear: async (c: Context) => {
    try {
      const userId = c.get('userId')
      const data = await ShoppingListService.clear(userId)
      return success(c, data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to clear shopping list'
      return error(c, message)
    }
  },
}
