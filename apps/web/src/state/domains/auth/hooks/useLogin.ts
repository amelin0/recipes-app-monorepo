'use client'

import { useMutation } from '@tanstack/react-query'
import { AuthApi, type LoginRequest } from '@/data'
import { HttpService } from '@/shared/services'

export const useLogin = () => {
  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: (data: LoginRequest) => AuthApi.login(data),
    onSuccess: (data) => {
      HttpService.setAccessToken(data.access_token)
    },
  })

  return {
    login: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  }
}
