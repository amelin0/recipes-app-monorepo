'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { NotificationsApi } from '@/data'
import { Queries } from '@/shared/services'

export const useMarkAllRead = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => NotificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [Queries.NOTIFICATIONS] })
      queryClient.invalidateQueries({ queryKey: [Queries.UNREAD_COUNT] })
    },
  })

  return { markAllRead: mutateAsync, isPending }
}
