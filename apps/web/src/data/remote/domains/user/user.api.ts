import { HttpService } from '@/shared/services'
import type { User, UserFilters, UserDetail, PaginatedResponse } from './user.types'

const ENDPOINTS = {
  USERS: '/admin/users',
  USER_BY_ID: (id: string) => `/admin/users/${id}`,
  BLOCK_USER: (id: string) => `/admin/users/${id}/block`,
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  if (entries.length === 0) return ''
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
}

export const UserApi = {
  getAll: (filters?: UserFilters) => {
    const query = buildQuery({
      search: filters?.search,
      gender: filters?.gender,
      country: filters?.country,
      language: filters?.language,
      page: filters?.page,
      limit: filters?.limit,
    })
    return HttpService.get<PaginatedResponse<User>>(`${ENDPOINTS.USERS}${query}`)
  },

  getById: (id: string) => {
    return HttpService.get<UserDetail>(ENDPOINTS.USER_BY_ID(id))
  },

  blockUser: (id: string, isBlocked: boolean) => {
    return HttpService.patch<User>(ENDPOINTS.BLOCK_USER(id), { is_blocked: isBlocked })
  },
}
