import { HttpService } from '@/shared/services'
import type { Language } from './language.types'

export const LanguageApi = {
  getAll: () => HttpService.get<Language[]>('/admin/languages'),
}
