/**
 * The recipe contract as the admin API actually serves it.
 *
 * Four differences from the V1 shapes this file used to hold, each a decision
 * rather than a rename:
 *
 * - **camelCase, `{ data }` envelope, no `/admin` prefix** (ADR-0002/0004).
 * - **Grams only.** There is no `unit`: a dish whose totals must add up cannot
 *   contain «1 cup», whose macros nothing can compute.
 * - **Steps are structured**, not `string[]`: a number, an optional duration,
 *   translations, and the ingredients the step uses.
 * - **No `tag_ids`.** A dish has one category, one cuisine and any number of
 *   diets; a flat bag would let two cuisines through.
 */

export type TagKind = 'category' | 'cuisine' | 'diet'

export interface Tag {
  id: string
  kind: TagKind
  slug: string
  name: string
  emoji: string | null
}

/** A row of the catalogue table. */
export interface Recipe {
  id: string
  title: string
  photoUrl: string | null
  /** For the whole dish. Per serving is this divided by `servings`. */
  calories: number
  proteinG: number
  fatsG: number
  carbsG: number
  servings: number
  cookTimeMinutes: number | null
  /** Set only on dishes that arrived through an import. */
  importKey: string | null
  favoritesCount: number
  categorySlug: string | null
  cuisineSlug: string | null
  updatedAt: string
}

export interface RecipeTranslation {
  language: string
  title: string
}

export interface RecipeIngredient {
  id: string
  productId: string
  productName: string
  amountG: number
  sortOrder: number
}

export interface RecipeStep {
  id: string
  stepNumber: number
  durationMinutes: number | null
  translations: { language: string; title: string; description: string | null }[]
  /** Ids of rows in `ingredients` — «the 250 g of tomatoes in this dish». */
  ingredientIds: string[]
}

/** The whole dish, as the edit form loads it. */
export interface RecipeDetail {
  id: string
  importKey: string | null
  photoUrl: string | null
  servings: number
  cookTimeMinutes: number | null
  totalWeightG: number | null
  calories: number
  proteinG: number
  fatsG: number
  carbsG: number
  categoryId: string | null
  cuisineId: string | null
  dietIds: string[]
  favoritesCount: number
  translations: RecipeTranslation[]
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  createdAt: string
  updatedAt: string
}

export interface RecipeStepInput {
  stepNumber: number
  durationMinutes?: number | null
  translations: { language: string; title: string; description?: string | null }[]
  /**
   * Positions in this request's own `ingredients` array, not row ids — the ids
   * do not exist yet on create, and on update the old ones are about to be
   * replaced.
   */
  ingredientIndexes?: number[]
}

/**
 * The write body. Not partial: `ingredients` and `steps` are replaced whole,
 * so the form always sends the entire dish.
 *
 * Macros are absent on purpose — the server derives them from the composition,
 * so the number on the card always agrees with the list underneath it.
 */
export interface SaveRecipeParams {
  importKey?: string | null
  categoryId?: string | null
  cuisineId?: string | null
  dietIds?: string[]
  photoUrl?: string | null
  servings: number
  cookTimeMinutes?: number | null
  translations: RecipeTranslation[]
  ingredients: { productId: string; amountG: number }[]
  steps?: RecipeStepInput[]
}

export interface RecipeFilters {
  search?: string
  categoryId?: string
  cuisineId?: string
  /** Comma-separated ids; every one of them must be present on the dish. */
  dietIds?: string
  language?: string
  page?: number
  limit?: number
}

/** A product, as the composition editor picks them. */
export interface Product {
  id: string
  name: string
  groupName: string | null
  caloriesPer100g: number
  proteinPer100g: number
  fatsPer100g: number
  carbsPer100g: number
  servingWeightG: number | null
}

export interface ImportReport {
  created: number
  updated: number
  skipped: number
  /** `row` is the line number in the file, so an editor can go and fix it. */
  errors: { row: number; importKey: string | null; message: string }[]
}

/** What the server signs so the browser can PUT the photo straight to storage. */
export interface UploadGrant {
  uploadUrl: string
  /** Where the file will be readable — this is what goes back as `photoUrl`. */
  publicUrl: string
  key: string
  expiresAt: string
  /** Send verbatim with the PUT: they are part of what was signed. */
  headers: Record<string, string>
}
