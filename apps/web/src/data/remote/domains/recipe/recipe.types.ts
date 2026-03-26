export interface Recipe {
  id: string
  photo_url: string | null
  title: string
  calories: number
  proteins_g: number
  carbs_g: number
  fats_g: number
  servings: number
  cooking_time_minutes: number
  cooking_instructions: string[]
  favorites_count: number
  ingredients: { id: string; name: string; amount: number; unit: string }[]
  tags: { id: string; name: string }[]
  created_at: string
  updated_at: string
}

export interface RecipeTranslationInput {
  language: string
  title: string
  cooking_instructions: string[]
}

export interface RecipeIngredientInput {
  ingredient_id: string
  amount: number
  unit: string
}

export interface CreateRecipeParams {
  photo_url?: string
  calories: number
  proteins_g: number
  carbs_g: number
  fats_g: number
  servings: number
  cooking_time_minutes: number
  translations: RecipeTranslationInput[]
  ingredients: RecipeIngredientInput[]
  tag_ids: string[]
}

export interface RecipeFilters {
  search?: string
  tags?: string
  page?: number
  limit?: number
}

export interface RecipeFull {
  id: string
  photo_url: string | null
  calories: number
  proteins_g: number
  carbs_g: number
  fats_g: number
  servings: number
  cooking_time_minutes: number
  favorites_count: number
  recipe_translations: { language: string; title: string; cooking_instructions: string[] }[]
  recipe_ingredients: { amount: number; unit: string; ingredient_id: string; ingredients: { id: string; ingredient_translations: { language: string; name: string }[] } }[]
  recipe_tags: { tag_id: string; tags: { id: string; tag_translations: { language: string; name: string }[] } }[]
}

export interface Tag { id: string; name: string }
export interface Ingredient { id: string; name: string }

export interface ImportResult {
  imported: number
  errors: { recipe_key: string; error: string }[]
}

export interface PaginatedRecipes {
  data: Recipe[]
  total: number
  page: number
  limit: number
}

export interface Language {
  code: string
  name: string
  native_name: string
  is_rtl: boolean
  tier: number
  is_active: boolean
}
