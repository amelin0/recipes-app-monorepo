import type { Context } from 'hono'
import { SupportService } from '../../shared/services/index.ts'
import { success, error } from '../../shared/helpers/response.helper.ts'

export const AdminSupportController = {
  getAll: async (c: Context) => {
    try {
      const { page, limit } = c.req.query()
      const data = await SupportService.getAll(page ? Number(page) : 1, limit ? Number(limit) : 20)
      return success(c, data)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed to get support messages')
    }
  },

  getById: async (c: Context) => {
    try {
      const id = c.req.param('id')
      const data = await SupportService.getById(id)
      return success(c, data)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Support message not found', 404)
    }
  },

  updateStatus: async (c: Context) => {
    try {
      const id = c.req.param('id')
      const { status } = await c.req.json()
      if (!['open', 'in_progress', 'resolved'].includes(status)) {
        return error(c, 'Invalid status')
      }
      const data = await SupportService.updateStatus(id, status)
      return success(c, data)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed to update status')
    }
  },
}
