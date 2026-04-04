'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TagApi } from '@/data'
import { Queries } from '@/shared/services'

export const useAssignTags = () => {
  const qc = useQueryClient()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: ({ recipe_ids, tag_ids }: { recipe_ids: string[]; tag_ids: string[] }) =>
      TagApi.assignToRecipes(recipe_ids, tag_ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [Queries.RECIPES] })
      qc.invalidateQueries({ queryKey: [Queries.TAGS] })
      qc.invalidateQueries({ queryKey: [Queries.TAGS_FULL] })
    },
  })
  return { assignTags: mutateAsync, isPending }
}

export const useRemoveTags = () => {
  const qc = useQueryClient()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: ({ recipe_ids, tag_ids }: { recipe_ids: string[]; tag_ids: string[] }) =>
      TagApi.removeFromRecipes(recipe_ids, tag_ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [Queries.RECIPES] })
      qc.invalidateQueries({ queryKey: [Queries.TAGS] })
      qc.invalidateQueries({ queryKey: [Queries.TAGS_FULL] })
    },
  })
  return { removeTags: mutateAsync, isPending }
}
