import { HttpService } from '@/shared/services'
import type { SupportMessageDetail, PaginatedSupportMessages } from './support.types'

export const SupportApi = {
  getAll: (page = 1, limit = 20) =>
    HttpService.get<PaginatedSupportMessages>(`/admin/support-messages?page=${page}&limit=${limit}`),

  getById: (id: string) =>
    HttpService.get<SupportMessageDetail>(`/admin/support-messages/${id}`),

  updateStatus: (id: string, status: string) =>
    HttpService.patch<unknown>(`/admin/support-messages/${id}/status`, { status }),
}
