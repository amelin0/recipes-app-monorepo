import { HttpService } from '@/shared/services'
import type { TagFull } from './tag.types'

/**
 * ⚠️ NONE of this has a server. Left in its V1 shape deliberately — see
 * `../../README.md`.
 *
 * What the panel calls a tag is, in the current model, one of three seeded
 * dictionaries: categories, cuisines and diets (ADR-0006). They ship with
 * migrations because the mobile filter screen is built around exactly those
 * chips, so there is no create, update, delete or assign — a dish's taxonomy
 * is set on the dish, through `categoryId` / `cuisineId` / `dietIds`.
 *
 * For **reading** them, the recipe form uses `RecipeApi.getTags()`, which
 * returns the flat façade the API really serves. Whether this management page
 * becomes a read-only reference list or a real editable fourth entity is a
 * product decision, not a technical one.
 */

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
