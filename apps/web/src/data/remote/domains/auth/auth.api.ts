import { HttpService } from '@/shared/services'
import type { LoginRequest, AuthResponse } from './auth.types'

const ENDPOINTS = {
  LOGIN: '/api/admin/auth/login',
}

export const AuthApi = {
  login: (data: LoginRequest) => {
    return HttpService.post<AuthResponse>(ENDPOINTS.LOGIN, data)
  },
}
