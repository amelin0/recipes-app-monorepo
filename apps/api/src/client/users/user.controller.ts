import type { Context } from 'hono'
import { UserService } from '../../shared/services/index.ts'
import { success, error } from '../../shared/helpers/response.helper.ts'

const VALID_LANGUAGES = ['uk', 'en', 'ru', 'es']
const VALID_METRIC_SYSTEMS = ['METRIC', 'IMPERIAL']

export const UserController = {
  getMe: async (c: Context) => {
    try {
      const userId = c.get('userId')
      const data = await UserService.getMe(userId)
      return success(c, data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to get profile'
      return error(c, message)
    }
  },

  updateLanguage: async (c: Context) => {
    try {
      const userId = c.get('userId')
      const { language } = await c.req.json()
      if (!language || !VALID_LANGUAGES.includes(language)) {
        return error(c, `Invalid language. Must be one of: ${VALID_LANGUAGES.join(', ')}`)
      }
      const data = await UserService.updateLanguage(userId, language)
      return success(c, data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to update language'
      return error(c, message)
    }
  },

  updateMetricSystem: async (c: Context) => {
    try {
      const userId = c.get('userId')
      const { metric_system } = await c.req.json()
      if (!metric_system || !VALID_METRIC_SYSTEMS.includes(metric_system)) {
        return error(c, `Invalid metric system. Must be one of: ${VALID_METRIC_SYSTEMS.join(', ')}`)
      }
      const data = await UserService.updateMetricSystem(userId, metric_system)
      return success(c, data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to update metric system'
      return error(c, message)
    }
  },

  updateWeight: async (c: Context) => {
    try {
      const userId = c.get('userId')
      const { weight_kg } = await c.req.json()
      if (weight_kg == null || typeof weight_kg !== 'number' || weight_kg <= 0) {
        return error(c, 'weight_kg must be a positive number')
      }
      const data = await UserService.updateWeight(userId, weight_kg)
      return success(c, data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to update weight'
      return error(c, message)
    }
  },

  getWeightHistory: async (c: Context) => {
    try {
      const userId = c.get('userId')
      const data = await UserService.getWeightHistory(userId)
      return success(c, data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to get weight history'
      return error(c, message)
    }
  },
}
