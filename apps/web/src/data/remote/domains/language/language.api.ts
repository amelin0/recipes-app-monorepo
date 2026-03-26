import { HttpService } from '@/shared/services'
import type { Language } from '../recipe/recipe.types'

export const LanguageApi = {
  getAll: () => HttpService.get<Language[]>('/admin/languages'),
}
