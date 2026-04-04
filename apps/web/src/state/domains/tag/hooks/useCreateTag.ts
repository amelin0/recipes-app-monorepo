'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TagApi } from '@/data'
import { Queries } from '@/shared/services'

export const useCreateTag = () => {
  const qc = useQueryClient()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (translations: { language: string; name: string }[]) => TagApi.create(translations),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [Queries.TAGS] }); qc.invalidateQueries({ queryKey: [Queries.TAGS_FULL] }) },
  })
  return { createTag: mutateAsync, isPending }
}
