import type { TicketStatus, TicketType } from '@/data'

export const STATUS_LABEL: Record<TicketStatus, string> = {
  new: 'New',
  in_progress: 'In progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
}

export const STATUS_VARIANT: Record<TicketStatus, 'default' | 'outline' | 'destructive'> = {
  new: 'destructive',
  in_progress: 'outline',
  resolved: 'default',
  rejected: 'outline',
}

export const TYPE_LABEL: Record<TicketType, string> = {
  bug: 'Bug',
  not_working: 'Not working',
  improvement: 'Improvement',
  feature_request: 'Feature request',
  other: 'Other',
}
