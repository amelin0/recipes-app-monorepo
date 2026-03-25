export interface SupportMessage {
  id: string
  title: string
  description: string
  photo_url: string | null
  status: 'open' | 'in_progress' | 'resolved'
  created_at: string
  user: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

export interface SupportMessageDetail extends SupportMessage {
  updated_at: string
}

export interface PaginatedSupportMessages {
  data: SupportMessage[]
  total: number
  page: number
  limit: number
}
