'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UserApi } from '@/data'
import { Queries } from '@/shared/services'

export const useBlockUser = () => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: ({ id, isBlocked }: { id: string; isBlocked: boolean }) =>
      UserApi.blockUser(id, isBlocked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [Queries.ADMIN_USERS] })
      queryClient.invalidateQueries({ queryKey: [Queries.ADMIN_USER] })
    },
  })

  return {
    blockUser: mutateAsync,
    isPending,
    isError,
    error,
  }
}
