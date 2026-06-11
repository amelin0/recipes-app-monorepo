# Mobile - Services

All services live in `apps/mobile/src/shared/services/`. Pure TypeScript, no React.

## HttpService (`shared/services/http.service.ts`)

Axios-based HTTP client (`HttpService`).

- **Base URL:** `process.env.EXPO_PUBLIC_API_URL` (fallback `http://localhost:3000/api/v1`)
- **Timeout:** 30s
- **Request interceptor:** Reads access token from `AuthStorage` (SecureStore) and attaches `Authorization: Bearer <token>`. Dev-only request logging.
- **Response interceptor:** Strips axios `response.data` AND the backend's `{ data: T }` envelope (`ResponseInterceptor` from NestJS) so callers receive the payload directly.

### 401 → refresh flow

On 401, the interceptor performs single-flight refresh:

1. If the failing call is `/auth/refresh` itself, or the request was already replayed (`_retried`), fall through to logout (`AuthStorage.removeTokens()` + `useStore.switchAuthenticatedAction(false)`).
2. Otherwise, await `getOrStartRefresh()` — a module-scoped `Promise<string | null>` that all concurrent 401s share. The refresh call uses bare `axios.post('/auth/refresh', { refreshToken })` (NOT the interceptor instance) to avoid recursion.
3. On refresh success, persist the new token pair via `AuthStorage.saveTokens(...)` and replay the original request through `axiosInstance(original)`. The request interceptor re-attaches the new bearer.
4. On refresh failure (no refresh token / network / 401 on refresh) → logout.

The retry sets `original._retried = true` so a second 401 on the same request stops the loop and routes the user out.

### Public methods

`get / post / put / patch / delete` are thin generic wrappers around the axios instance, returning the unwrapped payload directly. There are also helpers `setAccessToken`, `clearTokens`, `getAccessToken` that delegate to `AuthStorage`.

```typescript
import { HttpService } from '@/shared/services';
```

## Query Client (`shared/services/query-client/`)

- `queryClient` — `QueryClient` instance (retry: 2, staleTime: 5 min)
- `Queries` — enum of all React Query keys (currently empty, populated as domains are added)
- `invalidateQueries(...keys: Queries[])` — helper to invalidate by key

```typescript
import { queryClient, Queries, invalidateQueries } from '@/shared/services';
```

## Storage Services

`shared/services/storages/`:

- **MMKV** (`react-native-mmkv`) — fast sync storage. Backs the Zustand `persist` middleware in `state/store.ts` (slot `app-storage`).
- **SecureStore** (`expo-secure-store`) — encrypted async storage. Used by `data/local/domains/auth/auth-storage.ts` for the access + refresh token pair under the single key `'token'` (object: `{ accessToken, refreshToken? }`).

## Analytics (`shared/services/analytics/`) — TODO

## Permissions (`shared/services/permissions/`) — TODO

## Barrel Export

```typescript
// All services exported from:
import { ... } from '@/shared/services';
```
