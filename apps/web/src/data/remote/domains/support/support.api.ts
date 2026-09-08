import { HttpService, type Paginated } from '@/shared/services'

import type { Ticket, TicketDetail, TicketFilters, TicketNote, TicketStatus } from './support.types'

function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
  if (entries.length === 0) return ''
  return '?' + new URLSearchParams(entries.map(([key, value]) => [key, String(value)])).toString()
}

/**
 * `feedback`, after the table and after the client's own
 * `POST /profile/feedback`. The V1 panel called it «support-messages» — a
 * third name for one entity.
 */
export const SupportApi = {
  getAll: (filters?: TicketFilters) =>
    HttpService.getPaginated<Ticket>(
      `/feedback${buildQuery({
        status: filters?.status,
        type: filters?.type,
        search: filters?.search,
        page: filters?.page,
        limit: filters?.limit,
      })}`,
    ),

  getById: (id: string) => HttpService.get<TicketDetail>(`/feedback/${id}`),

  setStatus: (id: string, status: TicketStatus) => HttpService.patch<void>(`/feedback/${id}/status`, { status }),

  /** Internal note. Append-only — there is no edit and no delete. */
  addNote: (id: string, body: string) => HttpService.post<TicketNote>(`/feedback/${id}/notes`, { body }),
}

export type { Paginated }
