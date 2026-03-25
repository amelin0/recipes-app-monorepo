import type { Context } from 'hono'
import { SupportService } from '../../shared/services/index.ts'
import { success, error } from '../../shared/helpers/response.helper.ts'

export const ClientSupportController = {
  create: async (c: Context) => {
    try {
      const userId = c.get('userId')
      const body = await c.req.json()
      if (!body.title || !body.description) return error(c, 'title and description are required')
      const data = await SupportService.create(userId, body)
      return success(c, data, 201)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed to create support message')
    }
  },
}
