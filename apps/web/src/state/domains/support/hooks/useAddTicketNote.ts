'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { SupportApi } from '@/data'
import { Queries } from '@/shared/services'

/** Append-only: there is no hook that edits or removes a note, because there is no route. */
export const useAddTicketNote = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending } = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => SupportApi.addNote(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [Queries.SUPPORT_MESSAGE] }),
  })

  return { addNote: mutateAsync, isPending }
}
