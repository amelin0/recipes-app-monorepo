'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { RecipeApi } from '@/data'
import { Queries } from '@/shared/services'

export const useImportRecipes = () => {
  const qc = useQueryClient()
  const { mutateAsync, isPending, data } = useMutation({
    mutationFn: (file: File) => RecipeApi.importCsv(file),
    onSuccess: () => qc.invalidateQueries({ queryKey: [Queries.RECIPES] }),
  })
  return { importRecipes: mutateAsync, isPending, result: data }
}
