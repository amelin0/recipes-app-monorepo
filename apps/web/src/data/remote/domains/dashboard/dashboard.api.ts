import { HttpService, type Paginated } from '@/shared/services'

import type { DashboardPeriod, FavoriteRecipe, Overview } from './dashboard.types'

export const DashboardApi = {
  getOverview: (days: DashboardPeriod) => HttpService.get<Overview>(`/stats/overview?days=${days}`),

  getFavorites: (page = 1, limit = 20) =>
    HttpService.getPaginated<FavoriteRecipe>(`/stats/favorites?page=${page}&limit=${limit}`),
}

export type { Paginated }
