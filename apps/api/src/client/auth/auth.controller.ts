import type { Context } from 'hono'
import { AuthService } from '../../shared/services/index.ts'
import { success, error } from '../../shared/helpers/response.helper.ts'

export const AuthController = {
  checkEmail: async (c: Context) => {
    try {
      const body = await c.req.json()
      if (!body.email) return error(c, 'Email is required')
      const data = await AuthService.checkEmail(body.email)
      return success(c, data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Check email failed'
      return error(c, message)
    }
  },

  login: async (c: Context) => {
    try {
      const body = await c.req.json()
      if (!body.email || !body.password) {
        return error(c, 'Email and password are required')
      }
      const data = await AuthService.login(body)
      return success(c, data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Login failed'
      return error(c, message, 401)
    }
  },

  register: async (c: Context) => {
    try {
      const body = await c.req.json()
      if (!body.email || !body.password || !body.full_name) {
        return error(c, 'Email, password and full_name are required')
      }
      const data = await AuthService.register(body)
      return success(c, data, 201)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Registration failed'
      return error(c, message)
    }
  },
}
