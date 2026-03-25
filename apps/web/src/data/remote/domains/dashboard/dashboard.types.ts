export interface RegistrationStats {
  total: number
  by_date: { date: string; count: number }[]
  by_language: { language: string; count: number }[]
  by_country: { country: string; count: number }[]
}

export interface Demographics {
  by_language: { language: string; count: number }[]
  by_country: { country: string; count: number }[]
}

export interface TopFavoritedRecipe {
  id: string
  title: string
  photo_url: string | null
  calories: number
  favorites_count: number
  demographics: Demographics
}

export interface FavoriteStatsUser {
  id: string
  first_name: string
  last_name: string
  email: string
  language: string
  country: string | null
  added_at: string
}

export interface FavoriteStatsRecipe {
  id: string
  title: string
  photo_url: string | null
  calories: number
  favorites_count: number
  users: FavoriteStatsUser[]
  demographics: Demographics
}

export interface PaginatedFavoriteStats {
  data: FavoriteStatsRecipe[]
  total: number
  page: number
  limit: number
}
