import type { Context } from 'hono'
import { AuthService } from '../../shared/services/index.ts'
import { success, error } from '../../shared/helpers/response.helper.ts'

export const AdminAuthController = {
  login: async (c: Context) => {
    try {
      const body = await c.req.json()
      if (!body.email || !body.password) {
        return error(c, 'Email and password are required')
      }

      const data = await AuthService.login(body)

      if (!['ADMIN', 'SUPER_ADMIN'].includes(data.user.role)) {
        return error(c, 'Forbidden: not an admin', 403)
      }

      return success(c, data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Login failed'
      return error(c, message, 401)
    }
  },
}
