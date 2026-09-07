import type { ApiError, Paginated } from './http.types'

/**
 * `NEXT_PUBLIC_API_URL` points at the admin API's origin **including** the
 * version prefix — e.g. `https://dev.api.admin.rationfit.com/api/v1`. The
 * service does not add `/api/v1` itself: the prefix is deployment
 * configuration, not something a client should assume.
 *
 * There is no `/admin` segment anywhere. The admin service is told apart by
 * its own subdomain and port, not by a path (ADR-0002).
 */
const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '')

const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

const readToken = (key: string): string | null =>
  typeof window === 'undefined' ? null : localStorage.getItem(key)

const clearSession = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem('app-storage')
}

const signOut = () => {
  clearSession()
  window.location.href = '/login'
}

/**
 * One refresh at a time.
 *
 * The dashboard fires several queries at once, so a token expiring mid-screen
 * produces a burst of 401s. Without this, each of them would spend the same
 * refresh token — and the second to arrive would look like a replay, revoking
 * the whole chain and signing the editor out for doing nothing wrong.
 */
let refreshInFlight: Promise<boolean> | null = null

const refreshSession = async (): Promise<boolean> => {
  const refreshToken = readToken(REFRESH_TOKEN_KEY)
  if (!refreshToken) return false

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!res.ok) return false

    const json = (await res.json()) as { data: { accessToken: string; refreshToken: string } }
    HttpService.setSession(json.data.accessToken, json.data.refreshToken)

    return true
  } catch {
    return false
  }
}

const withRefresh = async (): Promise<boolean> => {
  refreshInFlight ??= refreshSession().finally(() => {
    refreshInFlight = null
  })

  return refreshInFlight
}

interface RequestOptions extends RequestInit {
  /** Set on the retry, so a failed refresh cannot loop. */
  isRetry?: boolean
}

const request = async <T = unknown>(url: string, options: RequestOptions = {}): Promise<T> => {
  const envelope = await requestEnvelope<{ data: T }>(url, options)
  return envelope.data
}

/**
 * The raw response, for the endpoints that also return `meta`.
 *
 * The API answers `{ data }` everywhere and `{ data, meta }` on paginated
 * collections; unwrapping to `data` unconditionally — which this service used
 * to do — loses the page count the tables need.
 */
const requestEnvelope = async <T>(url: string, options: RequestOptions = {}): Promise<T> => {
  const isFormData = options.body instanceof FormData
  const token = readToken(ACCESS_TOKEN_KEY)

  const headers: Record<string, string> = {
    // Never set Content-Type for FormData: the browser has to add the
    // multipart boundary itself, and an explicit header suppresses it.
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${url}`, { ...options, headers })

  if (res.status === 401) {
    // Access tokens live fifteen minutes, so this is the normal path through
    // an editor's afternoon rather than an exception. Refresh once, retry
    // once, and only then send them to the login screen.
    if (!options.isRetry && (await withRefresh())) {
      return requestEnvelope<T>(url, { ...options, isRetry: true })
    }

    signOut()
    throw new Error('Unauthorized')
  }

  if (res.status === 204) return undefined as T

  const json: unknown = await res.json().catch(() => null)

  if (!res.ok) {
    throw new HttpError(json as ApiError | null, res.status)
  }

  return json as T
}

/**
 * Carries the API's own error shape through to the UI.
 *
 * `code` is what a screen should branch on — a 409 from a duplicate import key
 * and a 409 from a dish in someone's meal plan need different words, and the
 * message alone cannot be relied on to tell them apart.
 */
export class HttpError extends Error {
  readonly status: number
  readonly code?: string
  readonly errors?: { path: string; message: string }[]

  constructor(body: ApiError | null, status: number) {
    super(body?.message ?? `Request failed: ${status}`)
    this.name = 'HttpError'
    this.status = status
    this.code = body?.code
    this.errors = body?.errors
  }
}

export const HttpService = {
  get: <T = unknown>(url: string) => request<T>(url),

  /** For paginated collections: keeps `meta` instead of throwing it away. */
  getPaginated: <T = unknown>(url: string) => requestEnvelope<Paginated<T>>(url),

  post: <T = unknown>(url: string, data?: unknown) =>
    request<T>(url, { method: 'POST', body: data === undefined ? undefined : JSON.stringify(data) }),

  put: <T = unknown>(url: string, data?: unknown) =>
    request<T>(url, { method: 'PUT', body: data === undefined ? undefined : JSON.stringify(data) }),

  patch: <T = unknown>(url: string, data?: unknown) =>
    request<T>(url, { method: 'PATCH', body: data === undefined ? undefined : JSON.stringify(data) }),

  delete: <T = unknown>(url: string) => request<T>(url, { method: 'DELETE' }),

  /** Multipart — used only by the CSV import, which the API really does read. */
  upload: <T = unknown>(url: string, formData: FormData) =>
    request<T>(url, { method: 'POST', body: formData }),

  setSession: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  },

  clearTokens: clearSession,

  getAccessToken: () => readToken(ACCESS_TOKEN_KEY),
  getRefreshToken: () => readToken(REFRESH_TOKEN_KEY),
}
