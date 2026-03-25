'use client'

import { useState } from 'react'
import { useRegistrationStats } from '@/state/domains/dashboard'

const PERIOD_OPTIONS = [
  { label: '7 days', days: 7 },
  { label: '1 month', days: 30 },
  { label: '3 months', days: 90 },
] as const

export const useDashboardPage = () => {
  const [days, setDays] = useState(7)
  const { stats, isLoading } = useRegistrationStats(days)

  return {
    days,
    setDays,
    stats,
    isLoading,
    periodOptions: PERIOD_OPTIONS,
  }
}
