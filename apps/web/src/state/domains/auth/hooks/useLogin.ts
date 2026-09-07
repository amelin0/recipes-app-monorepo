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
      // Both tokens: the access one expires in fifteen minutes, and without
      // the refresh token stored the panel would bounce the editor to the
      // login screen a quarter of an hour into their afternoon.
      HttpService.setSession(data.accessToken, data.refreshToken)
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
