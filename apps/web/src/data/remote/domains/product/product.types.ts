export interface Product {
  id: string
  name: string
  type: 'global' | 'custom'
  calories_per_100g: number
  proteins_per_100g: number
  carbs_per_100g: number
  fats_per_100g: number
  is_verified: boolean
  created_at: string
}

export interface ProductDetail {
  id: string
  type: 'global' | 'custom'
  calories_per_100g: number
  proteins_per_100g: number
  carbs_per_100g: number
  fats_per_100g: number
  is_verified: boolean
  created_by: string | null
  created_at: string
  product_translations: { language: string; name: string }[]
}

export interface ProductFilters {
  search?: string
  type?: string
  page?: number
  limit?: number
}

export interface PaginatedProducts {
  data: Product[]
  total: number
  page: number
  limit: number
}

export interface UpdateProductParams {
  calories_per_100g: number
  proteins_per_100g: number
  carbs_per_100g: number
  fats_per_100g: number
  translations: { language: string; name: string }[]
}
