'use client'

import { useQuery } from '@tanstack/react-query'
import { RecipeApi } from '@/data'
import { Queries } from '@/shared/services'

export const useGetRecipeFull = (id: string | null) => {
  const { data, isLoading } = useQuery({
    queryKey: [Queries.RECIPE_FULL, id],
    queryFn: () => RecipeApi.getByIdFull(id!),
    enabled: !!id,
  })

  return { recipe: data ?? null, isLoading }
}
