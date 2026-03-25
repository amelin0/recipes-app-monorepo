'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { SupportApi } from '@/data'
import { Queries } from '@/shared/services'

export const useGetSupportMessages = (page: number) => {
  const { data, isLoading } = useQuery({
    queryKey: [Queries.SUPPORT_MESSAGES, page],
    queryFn: () => SupportApi.getAll(page),
    placeholderData: keepPreviousData,
  })

  return {
    messages: data?.data ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    isLoading,
  }
}
