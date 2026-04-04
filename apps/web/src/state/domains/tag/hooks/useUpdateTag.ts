'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TagApi } from '@/data'
import { Queries } from '@/shared/services'

export const useUpdateTag = () => {
  const qc = useQueryClient()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: ({ id, translations }: { id: string; translations: { language: string; name: string }[] }) =>
      TagApi.update(id, translations),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [Queries.TAGS] }); qc.invalidateQueries({ queryKey: [Queries.TAGS_FULL] }) },
  })
  return { updateTag: mutateAsync, isPending }
}
