export interface Notification {
  id: string
  type: 'SUPPORT_MESSAGE' | 'NEW_USER' | 'SYSTEM'
  title: string
  body: string | null
  metadata: Record<string, unknown>
  is_read: boolean
  created_at: string
}

export interface PaginatedNotifications {
  data: Notification[]
  total: number
  unread_count: number
  page: number
  limit: number
}
