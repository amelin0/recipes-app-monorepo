import type { Context } from 'hono'
import { MealPlanService } from '../../shared/services/index.ts'
import { success, error } from '../../shared/helpers/response.helper.ts'

const VALID_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const VALID_MEALS = ['breakfast', 'lunch', 'dinner', 'snack']

export const MealPlanController = {
  getWeek: async (c: Context) => {
    try {
      const data = await MealPlanService.getWeek(c.get('userId'), c.get('language'))
      return success(c, data)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed')
    }
  },

  getToday: async (c: Context) => {
    try {
      const data = await MealPlanService.getToday(c.get('userId'), c.get('language'))
      return success(c, data)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed')
    }
  },

  getDay: async (c: Context) => {
    try {
      const day = c.req.param('day')
      if (!VALID_DAYS.includes(day)) return error(c, `Invalid day. Must be one of: ${VALID_DAYS.join(', ')}`)
      const data = await MealPlanService.getDay(c.get('userId'), day, c.get('language'))
      return success(c, data)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed')
    }
  },

  addItem: async (c: Context) => {
    try {
      const { day_of_week, meal_type, recipe_id, servings } = await c.req.json()
      if (!day_of_week || !VALID_DAYS.includes(day_of_week)) return error(c, 'Invalid day_of_week')
      if (!meal_type || !VALID_MEALS.includes(meal_type)) return error(c, 'Invalid meal_type')
      if (!recipe_id) return error(c, 'recipe_id is required')
      const data = await MealPlanService.addItem(c.get('userId'), day_of_week, meal_type, recipe_id, servings || 1)
      return success(c, data, 201)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed')
    }
  },

  removeItem: async (c: Context) => {
    try {
      await MealPlanService.removeItem(c.get('userId'), c.req.param('id'))
      return success(c, null)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed')
    }
  },

  clearDay: async (c: Context) => {
    try {
      const day = c.req.param('day')
      if (!VALID_DAYS.includes(day)) return error(c, 'Invalid day')
      await MealPlanService.clearDay(c.get('userId'), day)
      return success(c, null)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed')
    }
  },

  copyDay: async (c: Context) => {
    try {
      const { from_day, to_day } = await c.req.json()
      if (!from_day || !VALID_DAYS.includes(from_day)) return error(c, 'Invalid from_day')
      if (!to_day || !VALID_DAYS.includes(to_day)) return error(c, 'Invalid to_day')
      await MealPlanService.copyDay(c.get('userId'), from_day, to_day)
      const data = await MealPlanService.getDay(c.get('userId'), to_day, c.get('language'))
      return success(c, data)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed')
    }
  },

  dayToShoppingList: async (c: Context) => {
    try {
      const day = c.req.param('day')
      if (!VALID_DAYS.includes(day)) return error(c, 'Invalid day')
      const data = await MealPlanService.dayToShoppingList(c.get('userId'), day)
      return success(c, data)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed')
    }
  },
}
