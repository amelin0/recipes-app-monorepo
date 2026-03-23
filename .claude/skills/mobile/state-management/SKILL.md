---
name: state-management
description: Patterns for managing state with Zustand slices (client state) and React Query hooks (server state). Covers slice creation, combined store, and encapsulated query/mutation hooks.
---

# State Management Skill

## Purpose

Defines patterns for managing state with Zustand slices (client state) and React Query hooks (server state).

---

## Structure

```
state/
├── domains/
│   ├── auth/
│   │   ├── hooks/
│   │   │   ├── useSignIn.ts
│   │   │   ├── useSignUp.ts
│   │   │   ├── useGetCurrentUser.ts
│   │   │   └── index.ts
│   │   ├── auth.slice.ts
│   │   ├── auth.selectors.ts
│   │   └── index.ts
│   ├── user/
│   │   ├── hooks/
│   │   │   ├── useGetUser.ts
│   │   │   ├── useGetUsers.ts
│   │   │   ├── useUpdateUser.ts
│   │   │   └── index.ts
│   │   ├── user.slice.ts
│   │   └── index.ts
│   └── index.ts
├── store.ts
└── index.ts
```

---

## State Strategy

| Type                                 | Tool        | Location              |
| ------------------------------------ | ----------- | --------------------- |
| Auth state (tokens, isAuthenticated) | Zustand     | `auth.slice.ts`       |
| UI state (modals, forms)             | Zustand     | `*.slice.ts`          |
| Server data (users, posts)           | React Query | `hooks/useGet*.ts`    |
| Mutations (create, update, delete)   | React Query | `hooks/useUpdate*.ts` |

---

## Zustand Slices

### Slice Pattern

```typescript
// src/state/domains/auth/auth.slice.ts
import { StateCreator } from 'zustand';

export interface AuthSlice {
  // State
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;

  // Actions (always end with 'Action')
  switchAuthenticatedAction: (authenticated: boolean) => void;
  setAccessTokenAction: (token: string | null) => void;
  setRefreshTokenAction: (token: string | null) => void;
  setTokensAction: (accessToken: string, refreshToken: string) => void;
  logoutAction: () => void;
}

const initialState = {
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null
};

export const createAuthSlice: StateCreator<AuthSlice, [], [], AuthSlice> = set => ({
  ...initialState,

  switchAuthenticatedAction: isAuthenticated => set(() => ({ isAuthenticated })),

  setAccessTokenAction: accessToken => set(() => ({ accessToken })),

  setRefreshTokenAction: refreshToken => set(() => ({ refreshToken })),

  setTokensAction: (accessToken, refreshToken) => set(() => ({ accessToken, refreshToken })),

  logoutAction: () => set(() => initialState)
});
```

### Slice with Complex State

```typescript
// src/state/domains/user/user.slice.ts
import { StateCreator } from 'zustand';

import { User } from '@/data';

export interface UserSlice {
  currentUser: User | null;
  setCurrentUserAction: (user: User | null) => void;
  updateUserFieldAction: <K extends keyof User>(field: K, value: User[K]) => void;
  clearUserAction: () => void;
}

export const createUserSlice: StateCreator<UserSlice, [], [], UserSlice> = set => ({
  currentUser: null,

  setCurrentUserAction: currentUser => set(() => ({ currentUser })),

  updateUserFieldAction: (field, value) =>
    set(state => ({
      currentUser: state.currentUser ? { ...state.currentUser, [field]: value } : null
    })),

  clearUserAction: () => set(() => ({ currentUser: null }))
});
```

### UI Slice Example

```typescript
// src/state/domains/ui/ui.slice.ts
import { StateCreator } from 'zustand';

export interface UiSlice {
  isDrawerOpen: boolean;
  activeModal: string | null;
  toggleDrawerAction: () => void;
  openModalAction: (modalId: string) => void;
  closeModalAction: () => void;
}

export const createUiSlice: StateCreator<UiSlice, [], [], UiSlice> = set => ({
  isDrawerOpen: false,
  activeModal: null,

  toggleDrawerAction: () => set(state => ({ isDrawerOpen: !state.isDrawerOpen })),

  openModalAction: activeModal => set(() => ({ activeModal })),

  closeModalAction: () => set(() => ({ activeModal: null }))
});
```

---

## Combined Store

```typescript
// src/state/store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthSlice, createAuthSlice } from './domains/auth/auth.slice';
import { UserSlice, createUserSlice } from './domains/user/user.slice';
import { UiSlice, createUiSlice } from './domains/ui/ui.slice';

type StoreState = AuthSlice & UserSlice & UiSlice;

export const useStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createUserSlice(...a),
      ...createUiSlice(...a)
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist specific fields
      partialize: state => ({
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        currentUser: state.currentUser
      })
    }
  )
);
```

---

## Selectors

```typescript
// src/state/domains/auth/auth.selectors.ts
import { useStore } from '@/state/store';

// Simple selectors
export const useIsAuthenticated = () => useStore(state => state.isAuthenticated);

export const useAccessToken = () => useStore(state => state.accessToken);

// Composed selector
export const useAuthState = () =>
  useStore(state => ({
    isAuthenticated: state.isAuthenticated,
    accessToken: state.accessToken,
    refreshToken: state.refreshToken
  }));

// Action selector (stable references)
export const useAuthActions = () =>
  useStore(state => ({
    switchAuthenticated: state.switchAuthenticatedAction,
    setAccessToken: state.setAccessTokenAction,
    setTokens: state.setTokensAction,
    logout: state.logoutAction
  }));
```

---

## Domain Hooks (`state/domains/[domain]/hooks/`)

Domain hooks are **thin wrappers** around React Query that expose API calls with standardized return shapes. They do NOT contain business logic — they are purely data-fetching orchestration.

### Key Principles

- **Thin wrappers** — just configure useQuery/useMutation around API calls
- Return standardized shapes: `{ data, isLoading, isError, error, refetch }`
- Provide sensible defaults (empty arrays, nulls)
- Side effects (token storage, Zustand updates) go in `onSuccess`/`onError`
- **No navigation, no translations, no UI state** — those belong in screen hooks

### Query Hook (GET single)

```typescript
// src/state/domains/user/hooks/useGetUser.ts
import { useQuery } from '@tanstack/react-query';

import { UserApi } from '@/data';

export const useGetUser = (userId: string) => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await UserApi.getUser(userId);
      return response;
    },
    enabled: !!userId
  });

  return {
    user: data ?? null,
    isLoading,
    isError,
    error,
    refetch
  };
};
```

### Query Hook (GET list)

```typescript
// src/state/domains/user/hooks/useGetUsers.ts
import { useQuery } from '@tanstack/react-query';

import { UserApi } from '@/data';

export const useGetUsers = () => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await UserApi.getUsers();
      return response;
    }
  });

  return {
    users: data ?? [],
    isLoading,
    isError,
    error,
    refetch
  };
};
```

### Infinite Query (Pagination)

```typescript
// src/state/domains/user/hooks/useGetUsersInfinite.ts
import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

import { UserApi } from '@/data';

export const useGetUsersInfinite = (search?: string) => {
  const { data, isLoading, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['users', 'infinite', search],
      queryFn: async ({ pageParam }) => {
        const response = await UserApi.getUsers({ page: pageParam, search });
        return response;
      },
      initialPageParam: 1,
      getNextPageParam: lastPage =>
        lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined
    });

  const users = useMemo(() => {
    return data?.pages.flatMap(page => page.data) ?? [];
  }, [data]);

  return {
    users,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  };
};
```

### Mutation Hook

```typescript
// src/state/domains/auth/hooks/useSendOtpEmail.ts
import { useMutation } from '@tanstack/react-query';

import { AuthApi, SendOtpEmailRequest } from '@/data';

export const useSendOtpEmail = () => {
  const { mutateAsync, isPending, isSuccess, error } = useMutation({
    mutationFn: async (data: SendOtpEmailRequest) => {
      const response = await AuthApi.sendOtpEmail(data);
      return response;
    }
  });

  return {
    sendOtpEmail: mutateAsync,
    isPending,
    isSuccess,
    error
  };
};
```

### Mutation with Side Effects

```typescript
// src/state/domains/auth/hooks/useLogin.ts
import { useMutation } from '@tanstack/react-query';

import { AuthStorage } from '@/data/local';
import { AuthApi, SignInEmailRequest } from '@/data';
import { useStore } from '@/state/store';

export const useLogin = () => {
  const switchAuthenticatedAction = useStore(s => s.switchAuthenticatedAction);

  const { mutateAsync, isPending, isSuccess, error } = useMutation({
    mutationFn: async (data: SignInEmailRequest) => {
      const response = await AuthApi.signInEmail(data);
      return response;
    },
    onSuccess: async data => {
      await AuthStorage.saveTokens({ accessToken: data.payload.accessToken });
      switchAuthenticatedAction(true);
    }
  });

  return {
    login: mutateAsync,
    isPending,
    isSuccess,
    error
  };
};
```

### Mutation with Cache Invalidation

```typescript
// src/state/domains/wallet/hooks/useCreateWallet.ts
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/shared/services';

import { WalletApi, CreateWalletRequest } from '@/data';

export const useCreateWallet = () => {

  const { mutateAsync, isPending, isSuccess, error } = useMutation({
    mutationFn: async (data: CreateWalletRequest) => {
      const response = await WalletApi.createWallet(data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    }
  });

  return {
    createWallet: mutateAsync,
    isPending,
    isSuccess,
    error
  };
};
```

---

## Barrel Exports

```typescript
// src/state/domains/auth/hooks/index.ts
export { useSignInEmail } from './useSignInEmail';
export { useSendOtpEmail } from './useSendOtpEmail';

// src/state/domains/auth/index.ts
export { createAuthSlice } from './auth.slice';
export type { AuthSlice } from './auth.slice';
export * from './hooks';

// src/state/index.ts
export { useStore } from './store';
export * from './domains/auth';
export * from './domains/user';
```

---

## Usage — Screen Hooks Consume Domain Hooks

**Screens NEVER use React Query hooks directly.** Instead, each screen has a dedicated `useScreenName.ts` hook that consumes domain hooks and adds screen-specific logic (navigation, translations, form state, computed values). See [Components Skill](../components/SKILL.md) for the full screen hook pattern.

```typescript
// src/view/auth/sign-in/useSignInScreen.ts
import { useCallback, useState } from 'react';
import { router } from 'expo-router';

import { useSignInEmail } from '@/state/domains/auth/hooks';

export const useSignInScreen = () => {
  const [email, setEmail] = useState('');
  const signInEmail = useSignInEmail();

  const handleContinue = useCallback(async () => {
    if (!email.trim()) return;
    await signInEmail.mutateAsync({ email: email.trim() });
  }, [email, signInEmail]);

  return {
    email,
    setEmail,
    handleContinue,
    isLoading: signInEmail.isPending,
  };
};

// src/view/auth/sign-in/SignInScreen.tsx — purely presentational
export const SignInScreen: React.FC = () => {
  const { email, setEmail, handleContinue, isLoading } = useSignInScreen();
  // Only renders JSX, no logic
};
```
