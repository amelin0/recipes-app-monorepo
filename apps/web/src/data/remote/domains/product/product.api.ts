import { HttpService, type Paginated } from '@/shared/services'

import type { Product, ProductDetail, ProductFilters, ProductImportReport, SaveProductParams } from './product.types'

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
  if (entries.length === 0) return ''
  return '?' + new URLSearchParams(entries.map(([key, value]) => [key, String(value)])).toString()
}

export const ProductApi = {
  getAll: (filters?: ProductFilters) =>
    HttpService.getPaginated<Product>(
      `/products${buildQuery({
        search: filters?.search,
        source: filters?.source,
        isVerified: filters?.isVerified,
        isQuickPick: filters?.isQuickPick,
        includeArchived: filters?.includeArchived,
        language: filters?.language,
        page: filters?.page,
        limit: filters?.limit,
      })}`,
    ),

  getById: (id: string) => HttpService.get<ProductDetail>(`/products/${id}`),

  create: (data: SaveProductParams) => HttpService.post<ProductDetail>('/products', data),

  /** `PUT`: translations are replaced whole, so the request carries them all. */
  update: (id: string, data: SaveProductParams) => HttpService.put<ProductDetail>(`/products/${id}`, data),

  /**
   * Confirming a user's product **promotes** it: it becomes part of the shared
   * catalogue and visible to everyone, and its author is cleared.
   */
  setVerified: (id: string, isVerified: boolean) =>
    HttpService.patch<void>(`/products/${id}/verification`, { isVerified }),

  /**
   * Out of the catalogue without deleting. Dishes, meal-log entries and
   * shopping lists that reference it stay intact; it disappears from search
   * both here and in the app.
   */
  setArchived: (id: string, archived: boolean) => HttpService.patch<void>(`/products/${id}/archive`, { archived }),

  importCsv: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return HttpService.upload<ProductImportReport>('/products/import', formData)
  },
}

export type { Paginated }
