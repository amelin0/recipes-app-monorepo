'use client'

import { useQuery } from '@tanstack/react-query'
import { UserApi } from '@/data'
import { Queries } from '@/shared/services'

export const useGetUser = (id: string | null) => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [Queries.ADMIN_USER, id],
    queryFn: () => UserApi.getById(id!),
    enabled: !!id,
  })

  return {
    user: data ?? null,
    isLoading,
    isError,
    error,
    refetch,
  }
}
