import { AuthStorage } from '@/data/local/domains/auth/auth-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

const request = async <T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<T> => {
  const token = await AuthStorage.getAccessToken();

  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${url}`, { ...options, headers });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || `Request failed: ${res.status}`);
  }

  return json.data as T;
};

export const HttpService = {
  get: <T = unknown>(url: string) => request<T>(url),

  post: <T = unknown>(url: string, data?: unknown) =>
    request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = unknown>(url: string, data?: unknown) =>
    request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = unknown>(url: string, data?: unknown) =>
    request<T>(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = unknown>(url: string) =>
    request<T>(url, { method: 'DELETE' }),
};
