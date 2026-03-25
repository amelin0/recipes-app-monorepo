import type { Context } from 'hono'
import { UserService } from '../../shared/services/index.ts'
import { success, error } from '../../shared/helpers/response.helper.ts'

export const AdminUserController = {
  getAll: async (c: Context) => {
    try {
      const data = await UserService.getAll()
      return success(c, data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to get users'
      return error(c, message)
    }
  },

  getAllPaginated: async (c: Context) => {
    try {
      const { search, gender, country, language, page, limit } = c.req.query()
      const data = await UserService.getAllPaginated({
        search: search || undefined,
        gender: gender || undefined,
        country: country || undefined,
        language: language || undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      })
      return success(c, data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to get users'
      return error(c, message)
    }
  },

  getById: async (c: Context) => {
    try {
      const id = c.req.param('id')
      const data = await UserService.getById(id)
      return success(c, data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'User not found'
      return error(c, message, 404)
    }
  },

  toggleBlock: async (c: Context) => {
    try {
      const id = c.req.param('id')
      const { is_blocked } = await c.req.json()
      if (typeof is_blocked !== 'boolean') {
        return error(c, 'is_blocked must be a boolean')
      }
      const data = await UserService.toggleBlock(id, is_blocked)
      return success(c, data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to update user'
      return error(c, message)
    }
  },

  getRegistrationStats: async (c: Context) => {
    try {
      const { days } = c.req.query()
      const data = await UserService.getRegistrationStats(days ? Number(days) : 7)
      return success(c, data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to get stats'
      return error(c, message)
    }
  },
}
