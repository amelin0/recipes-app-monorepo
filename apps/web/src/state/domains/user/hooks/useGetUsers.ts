'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { UserApi } from '@/data'
import type { UserFilters } from '@/data'
import { Queries } from '@/shared/services'

export const useGetUsers = (filters: UserFilters) => {
  const { data, isLoading } = useQuery({
    queryKey: [Queries.ADMIN_USERS, filters],
    queryFn: () => UserApi.getAll(filters),
    placeholderData: keepPreviousData,
  })

  return {
    users: data?.data ?? [],
    total: data?.meta.total ?? 0,
    page: data?.meta.page ?? 1,
    totalPages: data?.meta.totalPages ?? 1,
    isLoading,
  }
}
