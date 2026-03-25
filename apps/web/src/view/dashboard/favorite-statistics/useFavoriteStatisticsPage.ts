'use client'

import { useState } from 'react'
import { useFavoriteStats } from '@/state/domains/dashboard'

export const useFavoriteStatisticsPage = () => {
  const [page, setPage] = useState(1)
  const { recipes, total, isLoading } = useFavoriteStats(page)

  const totalPages = Math.ceil(total / 20)

  return { recipes, total, page, totalPages, isLoading, setPage }
}
