const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '')

const TOKEN_KEY = 'access_token'

const getToken = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

const request = async <T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<T> => {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${url}`, { ...options, headers })
  const json = await res.json()

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

  setAccessToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearTokens: () => localStorage.removeItem(TOKEN_KEY),
  getAccessToken: () => getToken(),
}
