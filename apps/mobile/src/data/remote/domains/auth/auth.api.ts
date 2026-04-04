import { HttpService } from '@/shared/services/http.service';

import type {
  CheckEmailRequest,
  CheckEmailResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from './auth.types';

const ENDPOINTS = {
  CHECK_EMAIL: '/auth/check-email',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
} as const;

export const AuthApi = {
  checkEmail: (data: CheckEmailRequest) =>
    HttpService.post<CheckEmailResponse>(ENDPOINTS.CHECK_EMAIL, data),

  login: (data: LoginRequest) => HttpService.post<LoginResponse>(ENDPOINTS.LOGIN, data),

  register: (data: RegisterRequest) =>
    HttpService.post<RegisterResponse>(ENDPOINTS.REGISTER, data),
};
