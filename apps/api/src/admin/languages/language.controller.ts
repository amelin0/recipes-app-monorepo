import type { Context } from 'hono'
import { LanguageService } from '../../shared/services/index.ts'
import { success, error } from '../../shared/helpers/response.helper.ts'

export const AdminLanguageController = {
  getAll: async (c: Context) => {
    try {
      const data = await LanguageService.getAll()
      return success(c, data)
    } catch (e: unknown) {
      return error(c, e instanceof Error ? e.message : 'Failed to get languages')
    }
  },
}
