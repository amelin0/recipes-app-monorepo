export type ContentSource = 'global' | 'custom'

/** A row of the products table. */
export interface Product {
  id: string
  name: string
  /** The identity a recipe CSV addresses it by — `Tomatoes:250`. */
  nameEn: string | null
  source: ContentSource
  groupSlug: string | null
  caloriesPer100g: number
  proteinPer100g: number
  fatsPer100g: number
  carbsPer100g: number
  servingWeightG: number | null
  /** Shown as a one-tap chip on the app's filter screen. */
  isQuickPick: boolean
  isVerified: boolean
  /** Null for catalogue products; set while a user still owns it. */
  createdBy: string | null
  /** Set means out of the catalogue but still referenced by existing data. */
  archivedAt: string | null
  createdAt: string
}

export interface ProductDetail extends Product {
  groupId: string | null
  translations: { language: string; name: string; servingLabel: string | null }[]
  /** Catalogue dishes using it — what the archive dialog reports. */
  usedInRecipes: number
}

export interface ProductFilters {
  search?: string
  source?: ContentSource
  isVerified?: boolean
  isQuickPick?: boolean
  includeArchived?: boolean
  language?: string
  page?: number
  limit?: number
}

/**
 * The write body. Not partial: translations are replaced whole, so the form
 * always sends them all.
 */
export interface SaveProductParams {
  groupSlug?: string | null
  caloriesPer100g: number
  proteinPer100g: number
  fatsPer100g: number
  carbsPer100g: number
  servingWeightG?: number | null
  isQuickPick?: boolean
  translations: { language: string; name: string; servingLabel?: string | null }[]
}

export interface ProductImportReport {
  created: number
  updated: number
  skipped: number
  errors: { row: number; importKey: string | null; message: string }[]
}
