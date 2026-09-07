import { HttpService } from '@/shared/services'
import type { ProductDetail, ProductFilters, PaginatedProducts, UpdateProductParams } from './product.types'

function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  if (entries.length === 0) return ''
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
}

/**
 * ⚠️ NONE of this has a server yet — the admin product domain is its own
 * slice. Left in its V1 shape deliberately; see `../../README.md`.
 *
 * The recipe form does not use this: it picks ingredients through
 * `RecipeApi.searchProducts()`, which hits the one product endpoint that does
 * exist.
 */
export const ProductApi = {
  getAll: (filters?: ProductFilters) => {
    const query = buildQuery({
      search: filters?.search,
      type: filters?.type,
      page: filters?.page,
      limit: filters?.limit,
    })
    return HttpService.get<PaginatedProducts>(`/admin/products${query}`)
  },

  getById: (id: string) =>
    HttpService.get<ProductDetail>(`/admin/products/${id}`),

  update: (id: string, params: UpdateProductParams) =>
    HttpService.put<ProductDetail>(`/admin/products/${id}`, params),

  verify: (id: string, isVerified: boolean) =>
    HttpService.patch<unknown>(`/admin/products/${id}/verify`, { is_verified: isVerified }),
}
