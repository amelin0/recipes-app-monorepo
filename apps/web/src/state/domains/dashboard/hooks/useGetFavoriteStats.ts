'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { DashboardApi } from '@/data'
import { Queries } from '@/shared/services'

export const useGetFavoriteStats = (page: number) => {
  const { data, isLoading } = useQuery({
    queryKey: [Queries.FAVORITE_STATS, page],
    queryFn: () => DashboardApi.getFavorites(page),
    placeholderData: keepPreviousData,
  })

  return {
    recipes: data?.data ?? [],
    total: data?.meta.total ?? 0,
    totalPages: data?.meta.totalPages ?? 1,
    isLoading,
  }
}
