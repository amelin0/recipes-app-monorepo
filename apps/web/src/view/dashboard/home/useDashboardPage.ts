'use client'

import { useState } from 'react'
import { useGetOverview } from '@/state/domains/dashboard'
import type { DashboardPeriod } from '@/data'

const PERIOD_OPTIONS: { label: string; days: DashboardPeriod }[] = [
  { label: '7 days', days: 7 },
  { label: '1 month', days: 30 },
  { label: '3 months', days: 90 },
]

export const useDashboardPage = () => {
  const [days, setDays] = useState<DashboardPeriod>(7)
  const { overview, isLoading } = useGetOverview(days)

  return { days, setDays, overview, isLoading, periodOptions: PERIOD_OPTIONS }
}
