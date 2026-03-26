const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '')

const TOKEN_KEY = 'access_token'
const TOKEN_EXPIRES_KEY = 'access_token_expires'
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

const getToken = () => {
  if (typeof window === 'undefined') return null

  const expires = localStorage.getItem(TOKEN_EXPIRES_KEY)
  if (expires && Date.now() > Number(expires)) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRES_KEY)
    return null
  }

  return localStorage.getItem(TOKEN_KEY)
}

const handleUnauthorized = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRES_KEY)
  localStorage.removeItem('app-storage')
  window.location.href = '/login'
}

const request = async <T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<T> => {
  const token = getToken()

  if (!token && !url.includes('/auth/')) {
    handleUnauthorized()
    throw new Error('Unauthorized')
  }

  const isFormData = options.body instanceof FormData
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${url}`, { ...options, headers })
  const json = await res.json()

  if (res.status === 401) {
    handleUnauthorized()
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    throw new Error(json.error || `Request failed: ${res.status}`)
  }

  return json.data as T
}

export const HttpService = {
  get: <T = unknown>(url: string) => request<T>(url),

  post: <T = unknown>(url: string, data?: unknown) =>
    request<T>(url, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),

  put: <T = unknown>(url: string, data?: unknown) =>
    request<T>(url, { method: 'PUT', body: data ? JSON.stringify(data) : undefined }),

  patch: <T = unknown>(url: string, data?: unknown) =>
    request<T>(url, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),

  delete: <T = unknown>(url: string) =>
    request<T>(url, { method: 'DELETE' }),

  upload: <T = unknown>(url: string, formData: FormData) =>
    request<T>(url, { method: 'POST', body: formData }),

  setAccessToken: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(TOKEN_EXPIRES_KEY, String(Date.now() + TOKEN_TTL_MS))
  },
  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRES_KEY)
  },
  getAccessToken: () => getToken(),
}
