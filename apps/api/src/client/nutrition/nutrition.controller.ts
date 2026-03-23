import type { Context } from 'hono'
import { NutritionService } from '../../shared/services/index.ts'
import { success, error } from '../../shared/helpers/response.helper.ts'

export const NutritionController = {
  setGoal: async (c: Context) => {
    try {
      const userId = c.get('userId')
      const body = await c.req.json()

      const { daily_proteins_g, daily_carbs_g, daily_fats_g, daily_calories } = body

      if (daily_proteins_g == null || daily_carbs_g == null || daily_fats_g == null) {
        return error(c, 'daily_proteins_g, daily_carbs_g and daily_fats_g are required')
      }

      const data = await NutritionService.setGoal(userId, {
        daily_calories,
        daily_proteins_g,
        daily_carbs_g,
        daily_fats_g,
      })
      return success(c, data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to set goal'
      return error(c, message)
    }
  },

  getDaily: async (c: Context) => {
    try {
      const userId = c.get('userId')
      const date = c.req.query('date') || new Date().toISOString().split('T')[0]
      const data = await NutritionService.getDaily(userId, date)
      return success(c, data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to get daily stats'
      return error(c, message)
    }
  },
}
