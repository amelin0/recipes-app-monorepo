export interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  language: 'uk' | 'en' | 'ru' | 'es'
  metric_system: 'METRIC' | 'IMPERIAL'
  gender: 'male' | 'female' | 'other' | null
  weight_kg: number | null
  country: string | null
  is_blocked: boolean
  created_at: string
  updated_at: string
}

export interface UserFilters {
  search?: string
  gender?: string
  country?: string
  language?: string
  page?: number
  limit?: number
}

export interface NutritionGoal {
  daily_calories: number
  daily_proteins_g: number
  daily_carbs_g: number
  daily_fats_g: number
  is_auto_calculated: boolean
}

export interface WeightEntry {
  weight_kg: number
  recorded_at: string
}

export interface UserDetail extends User {
  nutrition_goal: NutritionGoal | null
  weight_history: WeightEntry[]
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
