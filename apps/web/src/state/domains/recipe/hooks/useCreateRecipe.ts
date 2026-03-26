'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { RecipeApi } from '@/data'
import type { CreateRecipeParams } from '@/data'
import { Queries } from '@/shared/services'

export const useCreateRecipe = () => {
  const qc = useQueryClient()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (data: CreateRecipeParams) => RecipeApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [Queries.RECIPES] }),
  })
  return { createRecipe: mutateAsync, isPending }
}
