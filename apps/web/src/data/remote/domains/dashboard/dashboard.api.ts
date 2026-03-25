import { HttpService } from '@/shared/services'
import type { RegistrationStats, TopFavoritedRecipe, PaginatedFavoriteStats } from './dashboard.types'

export const DashboardApi = {
  getRegistrationStats: (days: number) =>
    HttpService.get<RegistrationStats>(`/admin/users/stats?days=${days}`),

  getTopFavorited: (limit = 5) =>
    HttpService.get<TopFavoritedRecipe[]>(`/admin/favorites/top?limit=${limit}`),

  getFavoriteStats: (page = 1, limit = 20) =>
    HttpService.get<PaginatedFavoriteStats>(`/admin/favorites/stats?page=${page}&limit=${limit}`),
}
