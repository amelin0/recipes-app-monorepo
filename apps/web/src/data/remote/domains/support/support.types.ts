export type TicketType = 'bug' | 'not_working' | 'improvement' | 'feature_request' | 'other'

/** `rejected` is spam and duplicates — deliberately not «resolved». */
export type TicketStatus = 'new' | 'in_progress' | 'resolved' | 'rejected'

export interface TicketAuthor {
  id: string
  email: string
  isBlocked: boolean
}

/** A row of the support queue. */
export interface Ticket {
  id: string
  type: TicketType
  status: TicketStatus
  description: string
  imageCount: number
  replyEmail: string | null
  /** Null once the author deletes their account — the ticket survives. */
  author: TicketAuthor | null
  createdAt: string
}

export interface TicketNote {
  id: string
  /** Who wrote it, as of when they wrote it. */
  authorName: string
  body: string
  createdAt: string
}

export interface TicketDetail extends Ticket {
  imageUrls: string[]
  /** Whatever the app attached: version, platform, OS. */
  context: unknown
  /** Internal; never shown to the person who raised the ticket. */
  notes: TicketNote[]
}

export interface TicketFilters {
  status?: TicketStatus
  type?: TicketType
  search?: string
  page?: number
  limit?: number
}
