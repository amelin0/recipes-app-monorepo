import axios, {
    type AxiosError,
    type AxiosInstance,
    type AxiosRequestConfig,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
} from 'axios';

import { AuthStorage } from '@/data/local/domains/auth';
import { useStore } from '@/state';

// TODO: move to @dns/shared-types once the workspace package exists.
interface AuthTokensOutboundDto {
    accessToken: string;
    refreshToken: string;
}

const REFRESH_PATH = '/auth/refresh';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
    /** Set after a 401 retry so we don't loop forever if the refreshed token also fails. */
    _retried?: boolean;
};

const DEFAULT_BASE_URL = 'http://localhost:3000/api/v1';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, '');

const axiosInstance: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

/** Clear auth state and force the app back to the unauthenticated stack. */
async function handleUnauthenticated(): Promise<void> {
    await AuthStorage.removeTokens();
    // Flipping the flag lets `(app)/_layout.tsx` Stack.Protected route us out.
    useStore.getState().switchAuthenticatedAction(false);
}

/**
 * Single-flight refresh: every 401 in a burst awaits the same in-flight
 * promise, so we never fire `/auth/refresh` twice in parallel and never
 * race new tokens against each other.
 */
let pendingRefresh: Promise<string | null> | null = null;

async function refreshTokens(): Promise<string | null> {
    const refreshToken = await AuthStorage.getRefreshToken();
    if (!refreshToken) return null;

    try {
        // Use bare axios (not `axiosInstance`) so we don't recurse into the
        // 401 interceptor below if the refresh request itself returns 401.
        const response = await axios.post<{ data: AuthTokensOutboundDto } | AuthTokensOutboundDto>(
            `${BASE_URL}${REFRESH_PATH}`,
            { refreshToken },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000,
            },
        );
        const body = response.data as { data?: AuthTokensOutboundDto } | AuthTokensOutboundDto;
        const tokens = 'data' in body && body.data ? body.data : (body as AuthTokensOutboundDto);
        await AuthStorage.saveTokens({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
        return tokens.accessToken;
    } catch {
        return null;
    }
}

function getOrStartRefresh(): Promise<string | null> {
    if (!pendingRefresh) {
        pendingRefresh = refreshTokens().finally(() => {
            pendingRefresh = null;
        });
    }
    return pendingRefresh;
}

function formatRoute(config?: { method?: string; url?: string; baseURL?: string }): string {
    const method = config?.method?.toUpperCase() ?? 'REQ';
    const url = config?.url ?? '';
    return `${method} ${url}`;
}

/**
 * Strip the backend's `{ data: T }` envelope (NestJS `ResponseInterceptor`).
 * Some endpoints return 204 / empty bodies — passthrough those untouched.
 */
function unwrapEnvelope<T>(body: unknown): T {
    if (body && typeof body === 'object' && 'data' in body) {
        return (body as { data: T }).data;
    }
    return body as T;
}

// Request: attach Bearer token from SecureStore if present.
axiosInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = await AuthStorage.getAccessToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        if (__DEV__) {
            console.log(`[HTTP →] ${formatRoute(config)}`, config.data ?? '');
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error),
);

// Response: strip axios' `.data` AND the backend's `{ data: T }` envelope so
// callers receive the payload directly. On 401 clear tokens and redirect to
// sign-in via the store.
axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
        const payload = unwrapEnvelope(response.data);
        if (__DEV__) {
            console.log(`[HTTP ←] ${formatRoute(response.config)} → ${response.status}`, payload);
        }
        return payload as unknown as AxiosResponse;
    },
    async (error: AxiosError<{ message?: string }>) => {
        const status = error.response?.status;
        const original = error.config as RetryableRequestConfig | undefined;

        if (status === 401 && original) {
            const isRefreshCall = original.url?.endsWith(REFRESH_PATH);
            const alreadyRetried = original._retried === true;

            if (!isRefreshCall && !alreadyRetried) {
                original._retried = true;
                const newAccessToken = await getOrStartRefresh();
                if (newAccessToken) {
                    // Replay — request interceptor reattaches the fresh token.
                    return axiosInstance(original);
                }
            }

            await handleUnauthenticated();
        }

        const route = formatRoute(error.config);
        if (__DEV__) {
            console.log(`[HTTP ✕] ${route} → ${status ?? 'network'}`, error.response?.data ?? error.message);
        } else {
            console.error(`[HTTP] ${route} → ${status}`);
        }
        return Promise.reject(error.response?.data ?? error);
    },
);

export const HttpService = {
    client: axiosInstance,

    get: <T = unknown>(url: string, config?: AxiosRequestConfig) => axiosInstance.get<unknown, T>(url, config),

    post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
        axiosInstance.post<unknown, T>(url, data, config),

    put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
        axiosInstance.put<unknown, T>(url, data, config),

    patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
        axiosInstance.patch<unknown, T>(url, data, config),

    delete: <T = unknown>(url: string, config?: AxiosRequestConfig) => axiosInstance.delete<unknown, T>(url, config),

    setAccessToken: async (accessToken: string) => {
        await AuthStorage.saveTokens({ accessToken });
    },

    clearTokens: async () => {
        await AuthStorage.removeTokens();
    },

    getAccessToken: () => AuthStorage.getAccessToken(),
};
