'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { RecipeApi } from '@/data'
import type { CreateRecipeParams } from '@/data'
import { Queries } from '@/shared/services'

export const useUpdateRecipe = () => {
  const qc = useQueryClient()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateRecipeParams> }) => RecipeApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [Queries.RECIPES] })
      qc.invalidateQueries({ queryKey: [Queries.RECIPE_FULL] })
    },
  })
  return { updateRecipe: mutateAsync, isPending }
}
