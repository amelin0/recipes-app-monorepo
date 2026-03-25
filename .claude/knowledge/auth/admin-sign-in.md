# Auth — Admin Sign In (Web)

## Overview

Повний flow авторизації адміна у веб-панелі Ratio Fit. Від login page до захищеного dashboard з sidebar.

## Архітектура

```
LoginPage → useLoginPage → useLogin → AuthApi.login()
                               ↓
                    HttpService.setAccessToken()
                    switchAuthenticatedAction(true)
                               ↓
                    router.push("/") → AuthGuard → Dashboard + Sidebar
```

## Routing

```
app/
├── (auth)/
│   └── login/page.tsx         # Публічний — LoginPage без sidebar
├── (dashboard)/
│   ├── layout.tsx             # AuthGuard + Sidebar
│   └── page.tsx               # Dashboard
└── layout.tsx                 # Root (fonts, QueryProvider)
```

- `(auth)` — route group без layout, показує тільки LoginPage
- `(dashboard)` — route group з AuthGuard + Sidebar, всі захищені сторінки

## Стан авторизації

### Zustand Store (`state/store.ts`)

Persisted у `localStorage` через `zustand/middleware/persist`.

```typescript
type AppStore = AuthSlice & { reset: () => void }

// Зберігається між refresh сторінки:
partialize: (state) => ({ isAuthenticated: state.isAuthenticated })
```

### AuthSlice (`state/domains/auth/auth.slice.ts`)

```typescript
interface AuthSlice {
  isAuthenticated: boolean
  switchAuthenticatedAction: (authenticated: boolean) => void
}
```

## Data Layer

### AuthApi (`data/remote/domains/auth/auth.api.ts`)

```typescript
AuthApi.login({ email, password }) → POST /api/admin/auth/login
// Returns: { access_token, refresh_token, user: { id, email, full_name, role } }
```

### HttpService (`shared/services/http.service.ts`)

- `setAccessToken(token)` — зберігає в localStorage
- `getAccessToken()` — читає з localStorage
- `clearTokens()` — видаляє
- Автоматично додає `Authorization: Bearer <token>` до кожного запиту

## Auth Guard (`shared/ui/components/AuthGuard.tsx`)

Client component що перевіряє `isAuthenticated` з Zustand store:

1. Чекає hydration (SSR → client) через `useState(false)` + `useEffect`
2. Якщо не авторизований → `router.replace("/login")`
3. Поки не hydrated або не авторизований → рендерить `null` (без flash)
4. Авторизований → рендерить children

## Hooks

### useLogin (`state/domains/auth/hooks/useLogin.ts`)

React Query mutation:
1. Викликає `AuthApi.login()`
2. onSuccess → `HttpService.setAccessToken()` + `switchAuthenticatedAction(true)`
3. Returns: `{ login, isLoading, isError, error }`

### useLogout (`state/domains/auth/hooks/useLogout.ts`)

1. `HttpService.clearTokens()` — видаляє token
2. `resetStore()` — скидає Zustand (isAuthenticated = false)
3. `router.push("/login")` — redirect

### useLoginPage (`view/auth/login/useLoginPage.ts`)

Screen hook для LoginPage:
1. Локальний стан: email, password, error
2. `handleSubmit` → `login()` → `router.push("/")`
3. Catch → `setError(message)`

## View

### LoginPage (`view/auth/login/LoginPage.tsx`)

Split screen layout (з Figma дизайну):
- Ліва частина: темний фон з лого "RF"
- Права частина: форма (email, password, "Forgot password?", Sign in button)
- Responsive: на mobile тільки форма

### Sidebar (`shared/ui/components/Sidebar.tsx`)

Показується тільки для авторизованих (в dashboard layout):
- Лого "Ratio Fit"
- Collapsible navigation groups: Content, Planning, Management
- Bottom: Settings, Support
- User info з email

## Зв'язки

- **API endpoint:** `POST /api/admin/auth/login` → `AuthService.login()` + перевірка role = ADMIN/SUPER_ADMIN
- **Token:** зберігається в `localStorage` (key: `access_token`)
- **Auth state:** `localStorage` (key: `app-storage`, Zustand persist)
- **Deploy:** Vercel (https://recipes-app-monorepo.vercel.app)
