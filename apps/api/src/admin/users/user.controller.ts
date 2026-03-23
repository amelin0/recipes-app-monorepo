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
}
