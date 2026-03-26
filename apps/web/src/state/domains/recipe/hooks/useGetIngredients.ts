'use client'

import { useQuery } from '@tanstack/react-query'
import { RecipeApi } from '@/data'
import { Queries } from '@/shared/services'

export const useGetIngredients = () => {
  const { data, isLoading } = useQuery({
    queryKey: [Queries.INGREDIENTS],
    queryFn: () => RecipeApi.getIngredients(),
  })
  return { ingredients: data ?? [], isLoading }
}
