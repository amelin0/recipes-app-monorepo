import { HttpService, type Paginated } from '@/shared/services'

import type {
  ImportReport,
  Product,
  Recipe,
  RecipeDetail,
  RecipeFilters,
  SaveRecipeParams,
  Tag,
  UploadGrant,
} from './recipe.types'

function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
  if (entries.length === 0) return ''
  return '?' + new URLSearchParams(entries.map(([key, value]) => [key, String(value)])).toString()
}

export const RecipeApi = {
  getAll: (filters?: RecipeFilters) => {
    const query = buildQuery({
      search: filters?.search,
      categoryId: filters?.categoryId,
      cuisineId: filters?.cuisineId,
      dietIds: filters?.dietIds,
      language: filters?.language,
      page: filters?.page,
      limit: filters?.limit,
    })

    // getPaginated, not get: the table needs `meta.total` for its pager, and
    // unwrapping to `data` would throw it away.
    return HttpService.getPaginated<Recipe>(`/recipes${query}`)
  },

  /** One representation, not a light one plus a `/full` one — two nearly
   * identical shapes drift, and this screen opens a recipe at a time. */
  getById: (id: string) => HttpService.get<RecipeDetail>(`/recipes/${id}`),

  create: (data: SaveRecipeParams) => HttpService.post<RecipeDetail>('/recipes', data),

  /**
   * `PUT`, not `PATCH`: composition and steps are replaced whole, so the form
   * sends the entire dish. Omitting `ingredients` does not leave them alone —
   * there is no request that leaves them alone.
   */
  update: (id: string, data: SaveRecipeParams) => HttpService.put<RecipeDetail>(`/recipes/${id}`, data),

  deleteMany: (ids: string[]) => HttpService.post<{ deleted: number }>('/recipes/bulk-delete', { ids }),

  /** The three dictionaries as one flat list, each labelled with its `kind`. */
  getTags: () => HttpService.get<Tag[]>('/tags'),

  /** Products for the composition editor. A dish can only be built from what
   * the catalogue already holds — there is no «create product» here. */
  searchProducts: (search?: string, language = 'uk') =>
    HttpService.getPaginated<Product>(`/products${buildQuery({ search, language, limit: 50 })}`),

  /** The one place a file really travels through the API: a CSV has to be read
   * rather than stored, and at five hundred rows it is about 200 KB. */
  importCsv: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return HttpService.upload<ImportReport>('/recipes/import', formData)
  },

  /**
   * Photos do NOT go through the API — the server signs a URL and the browser
   * PUTs the bytes straight to storage. That is what keeps nginx in front of
   * the API at a 2 MB body limit and a 25 MB photo out of the worker's memory.
   */
  createImageUpload: (file: File) =>
    HttpService.post<UploadGrant>('/uploads/recipe-image', {
      fileName: file.name,
      contentType: file.type,
      size: file.size,
    }),

  uploadImage: async (file: File): Promise<string> => {
    const grant = await RecipeApi.createImageUpload(file)

    const res = await fetch(grant.uploadUrl, { method: 'PUT', headers: grant.headers, body: file })
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`)

    return grant.publicUrl
  },
}

export type { Paginated }
