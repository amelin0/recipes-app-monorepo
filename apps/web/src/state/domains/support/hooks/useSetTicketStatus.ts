'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { SupportApi } from '@/data'
import type { TicketStatus } from '@/data'
import { Queries } from '@/shared/services'

export const useSetTicketStatus = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TicketStatus }) => SupportApi.setStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [Queries.SUPPORT_MESSAGES] })
      queryClient.invalidateQueries({ queryKey: [Queries.SUPPORT_MESSAGE] })
    },
  })

  return { setStatus: mutateAsync, isPending }
}
