'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { UserApi } from '@/data'
import type { UserFilters } from '@/data'
import { Queries } from '@/shared/services'

export const useGetUsers = (filters: UserFilters) => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [Queries.ADMIN_USERS, filters],
    queryFn: () => UserApi.getAll(filters),
    placeholderData: keepPreviousData,
  })

  return {
    users: data?.data ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    limit: data?.limit ?? 20,
    isLoading,
    isError,
    error,
    refetch,
  }
}
