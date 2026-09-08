'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { DashboardApi } from '@/data'
import type { DashboardPeriod } from '@/data'
import { Queries } from '@/shared/services'

export const useGetOverview = (days: DashboardPeriod) => {
  const { data, isLoading } = useQuery({
    queryKey: [Queries.OVERVIEW, days],
    queryFn: () => DashboardApi.getOverview(days),
    // Switching the period should redraw the chart, not blank the screen.
    placeholderData: keepPreviousData,
  })

  return { overview: data ?? null, isLoading }
}
