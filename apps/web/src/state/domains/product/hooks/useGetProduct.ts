'use client'

import { useQuery } from '@tanstack/react-query'
import { ProductApi } from '@/data'
import { Queries } from '@/shared/services'

export const useGetProduct = (id: string | null) => {
  const { data, isLoading } = useQuery({
    queryKey: [Queries.PRODUCT, id],
    queryFn: () => ProductApi.getById(id!),
    enabled: !!id,
  })
  return { product: data ?? null, isLoading }
}
