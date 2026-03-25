'use client'

import { useMutation } from '@tanstack/react-query'
import { AuthApi, type LoginRequest } from '@/data'
import { HttpService } from '@/shared/services'
import { useStore } from '@/state/store'

export const useLogin = () => {
  const switchAuthenticated = useStore((s) => s.switchAuthenticatedAction)

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: (data: LoginRequest) => AuthApi.login(data),
    onSuccess: (data) => {
      HttpService.setAccessToken(data.access_token)
      switchAuthenticated(true)
    },
  })

  return {
    login: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  }
}
