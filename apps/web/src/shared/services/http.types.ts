/** The error body the API returns for every non-2xx. */
export interface ApiError {
  statusCode: number
  message: string
  /** Stable machine-readable reason — branch on this, never on the message. */
  code?: string
  /** Field-level detail, present on a 422. */
  errors?: { path: string; message: string }[]
}

/** What a paginated collection looks like on the wire. */
export interface Paginated<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
