'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { RecipeApi } from '@/data'
import type { RecipeFilters } from '@/data'
import { Queries } from '@/shared/services'

export const useGetRecipes = (filters: RecipeFilters) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: [Queries.RECIPES, filters],
    queryFn: () => RecipeApi.getAll(filters),
    placeholderData: keepPreviousData,
  })

  return {
    recipes: data?.data ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    isLoading,
    refetch,
  }
}
