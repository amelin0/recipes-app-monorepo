'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { SupportApi } from '@/data'
import type { TicketFilters } from '@/data'
import { Queries } from '@/shared/services'

export const useGetTickets = (filters: TicketFilters) => {
  const { data, isLoading } = useQuery({
    queryKey: [Queries.SUPPORT_MESSAGES, filters],
    queryFn: () => SupportApi.getAll(filters),
    placeholderData: keepPreviousData,
  })

  return {
    tickets: data?.data ?? [],
    total: data?.meta.total ?? 0,
    totalPages: data?.meta.totalPages ?? 1,
    isLoading,
  }
}
