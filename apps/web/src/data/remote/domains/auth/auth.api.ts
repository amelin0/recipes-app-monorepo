import { HttpService } from '@/shared/services'

import type { AdminProfile, AuthResponse, LoginRequest } from './auth.types'

/**
 * No `/admin` prefix: the admin API lives on its own subdomain and port, and
 * repeating that in the path would say twice what the hostname already says
 * (ADR-0002).
 */
export const AuthApi = {
  login: (data: LoginRequest) => HttpService.post<AuthResponse>('/auth/login', data),

  /** Whose session this is, read from the server rather than from localStorage —
   * it is also how the panel learns an account was deactivated. */
  me: () => HttpService.get<AdminProfile>('/auth/me'),

  /** Ends the session on the server too. Without this, «log out» only clears
   * the browser and a copied token keeps working. */
  logout: (refreshToken: string) => HttpService.post<void>('/auth/logout', { refreshToken }),
}
