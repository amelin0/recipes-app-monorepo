'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TagApi } from '@/data'
import { Queries } from '@/shared/services'

export const useDeleteTag = () => {
  const qc = useQueryClient()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (id: string) => TagApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [Queries.TAGS] }); qc.invalidateQueries({ queryKey: [Queries.TAGS_FULL] }) },
  })
  return { deleteTag: mutateAsync, isPending }
}
