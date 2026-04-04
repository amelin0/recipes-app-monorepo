import { HttpService } from '@/shared/services'
import type { TagFull } from './tag.types'

export const TagApi = {
  getAll: () =>
    HttpService.get<TagFull[]>('/admin/tags'),

  getById: (id: string) =>
    HttpService.get<TagFull>(`/admin/tags/${id}`),

  create: (translations: { language: string; name: string }[]) =>
    HttpService.post<TagFull>('/admin/tags', { translations }),

  update: (id: string, translations: { language: string; name: string }[]) =>
    HttpService.put<TagFull>(`/admin/tags/${id}`, { translations }),

  delete: (id: string) =>
    HttpService.delete(`/admin/tags/${id}`),

  assignToRecipes: (recipe_ids: string[], tag_ids: string[]) =>
    HttpService.post('/admin/tags/assign', { recipe_ids, tag_ids }),

  removeFromRecipes: (recipe_ids: string[], tag_ids: string[]) =>
    HttpService.post('/admin/tags/remove', { recipe_ids, tag_ids }),
}
