'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'

import { ProductApi } from '@/data'
import { Queries } from '@/shared/services'

/**
 * Products for the composition editor.
 *
 * Replaces `useGetIngredients`: there is no separate «ingredient» entity any
 * more (ADR-0006). An ingredient is a product playing a role in a dish, which
 * is what makes the dish's macros computable at all — the composition points
 * at the row that carries the numbers.
 */
export const useSearchProducts = (search?: string) => {
  const { data, isLoading } = useQuery({
    queryKey: [Queries.PRODUCTS_SEARCH, search],
    queryFn: () => ProductApi.getAll({ search, limit: 50 }),
    placeholderData: keepPreviousData,
  })

  return { products: data?.data ?? [], isLoading }
}
