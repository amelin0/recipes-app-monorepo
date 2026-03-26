'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { ProductApi } from '@/data'
import type { ProductFilters } from '@/data'
import { Queries } from '@/shared/services'

export const useGetProducts = (filters: ProductFilters) => {
  const { data, isLoading } = useQuery({
    queryKey: [Queries.PRODUCTS, filters],
    queryFn: () => ProductApi.getAll(filters),
    placeholderData: keepPreviousData,
  })

  return {
    products: data?.data ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    isLoading,
  }
}
