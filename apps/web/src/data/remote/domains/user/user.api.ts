import { HttpService, type Paginated } from '@/shared/services'

import type { User, UserDetail, UserFilters } from './user.types'

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
  if (entries.length === 0) return ''
  return '?' + new URLSearchParams(entries.map(([key, value]) => [key, String(value)])).toString()
}

export const UserApi = {
  getAll: (filters?: UserFilters) =>
    HttpService.getPaginated<User>(
      `/users${buildQuery({
        search: filters?.search,
        isBlocked: filters?.isBlocked,
        isEmailVerified: filters?.isEmailVerified,
        hasSubscription: filters?.hasSubscription,
        deletion: filters?.deletion,
        page: filters?.page,
        limit: filters?.limit,
      })}`,
    ),

  getById: (id: string) => HttpService.get<UserDetail>(`/users/${id}`),

  /**
   * Blocking revokes every session the account has; unblocking restores the
   * ability to sign in, not the sessions themselves.
   */
  setBlocked: (id: string, blocked: boolean) => HttpService.patch<void>(`/users/${id}/block`, { blocked }),

  /**
   * Cancels the **request**, not the account — the path names the request so
   * the two cannot be read for one another. There is no «delete account» call
   * here on purpose: ADR-0005 is still open.
   */
  cancelDeletionRequest: (id: string) => HttpService.delete<void>(`/users/${id}/deletion-request`),
}

export type { Paginated }
