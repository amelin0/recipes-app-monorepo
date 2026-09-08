'use client'

import { useState } from 'react'
import { useGetFavoriteStats } from '@/state/domains/dashboard'

export const useFavoriteStatisticsPage = () => {
  const [page, setPage] = useState(1)
  const { recipes, total, totalPages, isLoading } = useGetFavoriteStats(page)

  return { recipes, total, page, totalPages, isLoading, setPage }
}
