'use client'

import { useQuery } from '@tanstack/react-query'
import { SupportApi } from '@/data'
import { Queries } from '@/shared/services'

export const useGetTicket = (id: string | null) => {
  const { data, isLoading } = useQuery({
    queryKey: [Queries.SUPPORT_MESSAGE, id],
    queryFn: () => SupportApi.getById(id!),
    enabled: !!id,
  })

  return { ticket: data ?? null, isLoading }
}
