'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { DashboardApi } from '@/data'
import { Queries } from '@/shared/services'

export const useFavoriteStats = (page: number) => {
  const { data, isLoading } = useQuery({
    queryKey: [Queries.FAVORITE_STATS, page],
    queryFn: () => DashboardApi.getFavoriteStats(page, 20),
    placeholderData: keepPreviousData,
  })

  return {
    recipes: data?.data ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    isLoading,
  }
}
