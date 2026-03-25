'use client'

import { useQuery } from '@tanstack/react-query'
import { DashboardApi } from '@/data'
import { Queries } from '@/shared/services'

export const useRegistrationStats = (days: number) => {
  const { data, isLoading } = useQuery({
    queryKey: [Queries.REGISTRATION_STATS, days],
    queryFn: () => DashboardApi.getRegistrationStats(days),
  })

  return {
    stats: data ?? null,
    isLoading,
  }
}
