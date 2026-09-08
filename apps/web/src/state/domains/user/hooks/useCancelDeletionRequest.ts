'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UserApi } from '@/data'
import { Queries } from '@/shared/services'

/**
 * Cancels the user's own request to delete the account. There is no counterpart
 * that executes one — see ADR-0005.
 */
export const useCancelDeletionRequest = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (id: string) => UserApi.cancelDeletionRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [Queries.ADMIN_USERS] })
      queryClient.invalidateQueries({ queryKey: [Queries.ADMIN_USER] })
    },
  })

  return { cancelDeletionRequest: mutateAsync, isPending }
}
