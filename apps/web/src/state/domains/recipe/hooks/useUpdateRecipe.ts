'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { RecipeApi } from '@/data'
import type { SaveRecipeParams } from '@/data'
import { Queries } from '@/shared/services'

/**
 * `Partial<>` would be wrong here: the endpoint is a PUT that replaces the
 * composition and steps wholesale, so a caller omitting `ingredients` does not
 * leave them alone — it empties them.
 */
export const useUpdateRecipe = () => {
  const qc = useQueryClient()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SaveRecipeParams }) => RecipeApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [Queries.RECIPES] })
      qc.invalidateQueries({ queryKey: [Queries.RECIPE_FULL] })
    },
  })
  return { updateRecipe: mutateAsync, isPending }
}
