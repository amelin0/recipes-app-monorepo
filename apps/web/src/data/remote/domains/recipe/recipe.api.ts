import { HttpService } from '@/shared/services'
import type { Recipe, RecipeFilters, RecipeFull, CreateRecipeParams, Tag, Ingredient, ImportResult, PaginatedRecipes } from './recipe.types'

function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  if (entries.length === 0) return ''
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
}

export const RecipeApi = {
  getAll: (filters?: RecipeFilters) => {
    const query = buildQuery({
      search: filters?.search,
      tags: filters?.tags,
      page: filters?.page,
      limit: filters?.limit,
    })
    return HttpService.get<PaginatedRecipes>(`/admin/recipes${query}`)
  },

  getById: (id: string) =>
    HttpService.get<Recipe>(`/admin/recipes/${id}`),

  getByIdFull: (id: string) =>
    HttpService.get<RecipeFull>(`/admin/recipes/${id}/full`),

  create: (data: CreateRecipeParams) =>
    HttpService.post<Recipe>('/admin/recipes', data),

  update: (id: string, data: Partial<CreateRecipeParams>) =>
    HttpService.put<Recipe>(`/admin/recipes/${id}`, data),

  deleteMany: (ids: string[]) =>
    HttpService.post<{ deleted: number }>('/admin/recipes/delete', { ids }),

  getTags: () =>
    HttpService.get<Tag[]>('/admin/recipes/tags/all'),

  getIngredients: () =>
    HttpService.get<Ingredient[]>('/admin/recipes/ingredients/all'),

  importCsv: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return HttpService.upload<ImportResult>('/admin/recipes/import', formData)
  },

  uploadImage: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return HttpService.upload<{ url: string }>('/admin/upload/recipe-image', formData)
  },
}
