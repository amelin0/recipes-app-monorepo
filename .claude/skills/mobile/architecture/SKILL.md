---
name: architecture
description: Defines the layered architecture of the application with clear separation of concerns. Covers folder structure, module boundaries, and dependency rules between layers (app, view, shared, data, state).
---

# Architecture Skill

## Purpose

Defines the layered architecture of the application with clear separation of concerns.

## Architecture Overview

```
src/
├── app/                    # Expo Router (file-based routing)
│
├── view/                   # Presentation layer (screens by domain)
│   └── [domain]/
│       └── [screen]/
│
├── shared/                 # Shared layer
│   ├── ui/
│   │   ├── components/     # Simple reusable components
│   │   └── widgets/        # Complex composed components
│   ├── services/
│   │   ├── http.service.ts # HTTP client (axios)
│   │   └── storage.service.ts
│   ├── helpers/
│   └── utils/
│
├── data/                   # Data layer (API only)
│   ├── remote/
│   │   └── domains/
│   │       └── [domain]/
│   │           ├── [domain].api.ts
│   │           ├── [domain].types.ts
│   └── local/
│       └── domains/
│           └── [domain]/
│               └── [domain].storage.ts
│
└── state/                  # State layer
    └── domains/
        └── [domain]/
            ├── hooks/
            │   ├── useGetUser.ts
            │   └── useUpdateUser.ts
            └── [domain].slice.ts
```

---

## Layer Responsibilities

### 1. App Layer (`src/app/`) — Expo Router

**Purpose:** File-based routing. Route files are thin — only import screens.

```
app/
├── _layout.tsx             # Root layout (providers)
├── index.tsx               # Entry redirect
├── (auth)/
│   ├── _layout.tsx
│   ├── sign-in.tsx
│   └── sign-up.tsx
├── (tabs)/
│   ├── _layout.tsx
│   ├── index.tsx
│   └── profile.tsx
└── +not-found.tsx
```

**Example Route:**

```typescript
// src/app/(auth)/sign-in.tsx
import { SignInScreen } from '@/view/auth';

export default SignInScreen;
```

**Example Root Layout:**

```typescript
// src/app/_layout.tsx
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '@/shared/services';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
```

**Rules:**

- Route files only import and export screens from `view/`
- `_layout.tsx` handles providers and navigation config
- No business logic in app layer

---

### 2. View Layer (`src/view/`)

**Purpose:** UI screens organized by domain.

```
view/
├── auth/
│   ├── sign-in/
│   │   ├── SignInScreen.tsx       # Presentational — renders JSX only
│   │   ├── useSignInScreen.ts    # All logic — state, handlers, navigation
│   │   └── components/
│   │       └── LoginForm.tsx
│   └── index.ts
├── home/
│   ├── HomeScreen.tsx
│   ├── useHomeScreen.ts
│   └── index.ts
└── profile/
    ├── ProfileScreen.tsx
    ├── useProfileScreen.ts
    └── index.ts
```

**Rules:**

- Organized by domain
- **Every screen has a `useScreenName.ts` hook** — no exceptions
- Screen component is **purely presentational** — only destructures hook + renders JSX
- No `useState`, `useCallback`, `useMutation`, `useQuery` directly in screens
- Screen hooks consume domain hooks from `state/domains/`
- Screen-specific components in `components/` subfolder
- Use barrel exports (`index.ts`)

---

### 3. Shared Layer (`src/shared/`)

**Purpose:** Reusable code shared across the application.

```
shared/
├── ui/
│   ├── components/          # Simple, stateless, reusable
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Avatar.tsx
│   │   └── index.ts
│   └── widgets/             # Composed, may have non-domain logic
│       ├── DatePicker/
│       ├── PhoneInput/
│       ├── DocumentTypeDropdown.tsx
│       ├── SelectCountryDropdown.tsx
│       ├── SwipableStackList.tsx
│       └── index.ts
├── services/
│   ├── http.service.ts      # Axios HTTP client
│   ├── storage.service.ts   # AsyncStorage wrapper
│   ├── query-client.service.ts
│   └── index.ts
├── helpers/
│   ├── number.helper.ts
│   ├── date.helper.ts
│   └── index.ts
├── utils/
│   └── index.ts
├── hooks/
│   ├── useDebounce.ts
│   └── index.ts
├── constants/
│   └── index.ts
└── types/
    └── index.ts
```

#### UI Structure

| Folder        | Purpose                                  | Example                               |
| ------------- | ---------------------------------------- | ------------------------------------- |
| `components/` | Simple, stateless, highly reusable       | `Button`, `Input`, `Avatar`, `AppIcon`, `Header` |
| `widgets/`    | Composed from components, may have logic | `DatePicker`, `PhoneInput`, `SelectCountryDropdown`, `DocumentTypeDropdown` |

#### HTTP Service

```typescript
// src/shared/services/http.service.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import { useStore } from '@/state/store';
import { API_BASE_URL } from '@/shared/constants';

const createHttpService = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' }
  });

  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = useStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    response => response,
    async error => {
      if (error.response?.status === 401) {
        useStore.getState().logoutAction();
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export const httpService = createHttpService();
```

#### Storage Service

```typescript
// src/shared/services/storage.service.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storageService = {
  get: async <T>(key: string): Promise<T | null> => {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  },

  set: async <T>(key: string, value: T): Promise<void> => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },

  remove: async (key: string): Promise<void> => {
    await AsyncStorage.removeItem(key);
  },

  clear: async (): Promise<void> => {
    await AsyncStorage.clear();
  }
};
```

---

### 4. Data Layer (`src/data/`)

**Purpose:** API calls, DTOs, mappers. Uses `httpService` from shared.

```
data/
├── remote/
│   └── domains/
│       ├── auth/
│       │   ├── auth.api.ts
│       │   ├── auth.types.ts
│       │   └── index.ts
│       └── user/
│           ├── user.api.ts
│           ├── user.types.ts
│           └── index.ts
├── local/
│   └── domains/
│       └── auth/
│           ├── auth.storage.ts   # Uses storageService
│           └── index.ts
└── index.ts
```

#### API File

```typescript
// src/data/remote/domains/auth/auth.api.ts
import { httpService } from '@/shared/services';
import { SignInRequestDto, SignInResponseDto } from './auth.dto';

const ENDPOINTS = {
  SIGN_IN: '/auth/sign-in',
  SIGN_UP: '/auth/sign-up'
};

export const authApi = {
  signIn: async (data: SignInRequestDto): Promise<SignInResponseDto> => {
    const response = await HttpService.post<SignInResponseDto>('/auth/sign-in', data);
    return response.data;
  },

  signUp: async (data: SignUpRequestDto): Promise<SignInResponseDto> => {
    const response = await HttpService.post<SignInResponseDto>('/auth/sign-up', data);
    return response.data;
  }
};
```

#### Local Storage Instance

```typescript
// src/data/local/domains/auth/auth.storage.ts
import { storageService } from '@/shared/services';

const KEYS = {
  ACCESS_TOKEN: '@auth/access_token',
  REFRESH_TOKEN: '@auth/refresh_token',
  USER: '@auth/user'
};

export const authStorage = {
  getAccessToken: () => storageService.get<string>(KEYS.ACCESS_TOKEN),
  setAccessToken: (token: string) => storageService.set(KEYS.ACCESS_TOKEN, token),

  getRefreshToken: () => storageService.get<string>(KEYS.REFRESH_TOKEN),
  setRefreshToken: (token: string) => storageService.set(KEYS.REFRESH_TOKEN, token),

  clear: async () => {
    await storageService.remove(KEYS.ACCESS_TOKEN);
    await storageService.remove(KEYS.REFRESH_TOKEN);
    await storageService.remove(KEYS.USER);
  }
};
```

**Rules:**

- `*.api.ts` — API calls using `httpService`
- `*.types.ts` — Request/Response types
- `*.storage.ts` — Domain-specific storage using `storageService`

---

### 5. State Layer (`src/state/`)

**Purpose:** Zustand slices + React Query hooks.

```
state/
├── domains/
│   ├── auth/
│   │   ├── hooks/
│   │   │   ├── useSignIn.ts
│   │   │   ├── useSignUp.ts
│   │   │   └── index.ts
│   │   ├── auth.slice.ts
│   │   └── index.ts
│   ├── user/
│   │   ├── hooks/
│   │   │   ├── useGetUser.ts
│   │   │   ├── useUpdateUser.ts
│   │   │   └── index.ts
│   │   ├── user.slice.ts
│   │   └── index.ts
│   └── index.ts
├── store.ts
└── index.ts
```

#### Zustand Slice

```typescript
// src/state/domains/auth/auth.slice.ts
import { StateCreator } from 'zustand';

export interface AuthSlice {
  isAuthenticated: boolean;
  accessToken: string | null;
  switchAuthenticatedAction: (authenticated: boolean) => void;
  setAccessTokenAction: (token: string | null) => void;
  logoutAction: () => void;
}

export const createAuthSlice: StateCreator<AuthSlice, [], [], AuthSlice> = set => ({
  isAuthenticated: false,
  accessToken: null,

  switchAuthenticatedAction: isAuthenticated => set(() => ({ isAuthenticated })),

  setAccessTokenAction: accessToken => set(() => ({ accessToken })),

  logoutAction: () => set(() => ({ isAuthenticated: false, accessToken: null }))
});
```

#### Combined Store

```typescript
// src/state/store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthSlice, createAuthSlice } from './domains/auth/auth.slice';
import { UserSlice, createUserSlice } from './domains/user/user.slice';

type StoreState = AuthSlice & UserSlice;

export const useStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createUserSlice(...a)
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken
      })
    }
  )
);
```

#### React Query Hook

```typescript
// src/state/domains/user/hooks/useGetUser.ts
import { useQuery } from '@tanstack/react-query';

import { userApi, userMapper } from '@/data';

export const useGetUser = (userId: string) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => userApi.getUser(userId),
    select: userMapper.toUser,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000
  });
};
```

---

## Dependency Flow

```
┌─────────────────────────────────────────────────────────┐
│                    App (Expo Router)                    │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                        View                             │
└───────────┬─────────────────────────────┬───────────────┘
            │                             │
            ▼                             ▼
┌───────────────────────┐     ┌───────────────────────────┐
│        State          │     │         Shared            │
│  • Zustand Slices     │     │  • ui/components          │
│  • React Query Hooks  │     │  • ui/widgets             │
└───────────┬───────────┘     │  • services/http.service  │
            ▼                 │  • services/storage       │
┌───────────────────────┐     └───────────────────────────┘
│        Data           │                 ▲
│  • remote/domains     │─────────────────┘
│  • local/domains      │   (uses httpService, storageService)
└───────────────────────┘
```

**Rules:**

1. App → View (imports screens)
2. View → State, Shared
3. State hooks → Data APIs
4. Data → Shared services (`httpService`, `storageService`)
5. Shared has no dependencies on other layers

---

## File Naming Conventions

### Pattern: `[name].[type].ts`

| Type      | File Pattern      | Export Pattern                    |
| --------- | ----------------- | --------------------------------- |
| API       | `auth.api.ts`     | `AuthApi`                         |
| Service   | `http.service.ts` | `HttpService`                     |
| Storage   | `auth.storage.ts` | `AuthStorage`                     |
| Slice     | `auth.slice.ts`   | `createAuthSlice`                 |
| Types/DTO | `auth.dto.ts`     | `ILoginRequest`, `ILoginResponse` |
| Mapper    | `auth.mapper.ts`  | `AuthMapper`                      |

### Rule: kebab-case files → PascalCase exports

```typescript
// File: src/data/remote/domains/auth/auth.api.ts
export const AuthApi = { ... };

// File: src/shared/services/http.service.ts
export const HttpService = createHttpService();

// File: src/data/local/domains/auth/auth.storage.ts
export const AuthStorage = { ... };
```

---

## Import Aliases

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

```typescript
import { SignInScreen } from '@/view/auth';
import { useSignIn, useStore } from '@/state';
import { Button } from '@/shared/ui/components';
import { UserCard } from '@/shared/ui/widgets';
import { HttpService } from '@/shared/services';
import { AuthApi } from '@/data/remote';
import { AuthStorage } from '@/data/local';
```
