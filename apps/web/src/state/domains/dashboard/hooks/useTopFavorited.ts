'use client'

import { useQuery } from '@tanstack/react-query'
import { DashboardApi } from '@/data'
import { Queries } from '@/shared/services'

export const useTopFavorited = () => {
  const { data, isLoading } = useQuery({
    queryKey: [Queries.TOP_FAVORITED],
    queryFn: () => DashboardApi.getTopFavorited(5),
  })

  return { recipes: data ?? [], isLoading }
}
