'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { RecipeApi } from '@/data'
import { Queries } from '@/shared/services'

export const useDeleteRecipes = () => {
  const qc = useQueryClient()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (ids: string[]) => RecipeApi.deleteMany(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: [Queries.RECIPES] }),
  })
  return { deleteRecipes: mutateAsync, isPending }
}
