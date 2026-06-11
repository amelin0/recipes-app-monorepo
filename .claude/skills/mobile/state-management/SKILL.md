---
name: state-management
description: State management patterns for the DNS mobile app. Covers Zustand slices for client state and TanStack React Query hooks for server state.
---

# State Management Skill

## Overview

| Type         | Tool                 | Location                        |
| ------------ | -------------------- | ------------------------------- |
| Client state | Zustand (slices)     | `store/`                        |
| Server state | TanStack React Query | `state/domains/[domain]/hooks/` |
| HTTP client  | Axios                | `services/http.service.ts`      |

## Zustand Store

### Combined Store (`store/index.ts`)

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createAuthSlice, AuthSlice } from './slices/auth.slice';
import { createUiSlice, UiSlice } from './slices/ui.slice';

type AppStore = AuthSlice & UiSlice & { reset: () => void };

export const useStore = create<AppStore>()(
  persist(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createUiSlice(...a),
      reset: () => a[0]({
        isAuthenticated: false,
        // reset all slice defaults
      }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => /* MMKV adapter */),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
```

### Slice Pattern

```typescript
// store/slices/auth.slice.ts
import { StateCreator } from 'zustand';

export interface AuthSlice {
    isAuthenticated: boolean;
    switchAuthenticatedAction: (authenticated: boolean) => void;
}

export const createAuthSlice: StateCreator<AuthSlice, [], [], AuthSlice> = set => ({
    isAuthenticated: false,
    switchAuthenticatedAction: isAuthenticated => set(() => ({ isAuthenticated })),
});
```

### Selector Usage

```typescript
// Good — re-renders only when isAuthenticated changes
const isAuthenticated = useStore(state => state.isAuthenticated);

// Bad — re-renders on ANY store change
const { isAuthenticated } = useStore();
```

## React Query Hooks

### Query Hook Pattern

```typescript
// state/domains/workout/hooks/useGetWorkouts.ts
import { useQuery } from '@tanstack/react-query';
import { WorkoutApi } from '@/data';
import { Queries } from '@/services/query-keys';

export function useGetWorkouts() {
    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: [Queries.WORKOUTS],
        queryFn: () => WorkoutApi.getWorkouts(),
    });

    return { workouts: data?.data ?? [], isLoading, isError, error, refetch };
}
```

### Mutation Hook Pattern

```typescript
// state/domains/workout/hooks/useCreateWorkout.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { WorkoutApi, CreateWorkoutRequest } from '@/data';
import { Queries } from '@/services/query-keys';

export function useCreateWorkout() {
    const queryClient = useQueryClient();

    const { mutateAsync, isPending, isSuccess, error } = useMutation({
        mutationFn: (data: CreateWorkoutRequest) => WorkoutApi.createWorkout(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [Queries.WORKOUTS] });
        },
    });

    return { createWorkout: mutateAsync, isPending, isSuccess, error };
}
```

### Query Keys

```typescript
// services/query-keys.ts
export enum Queries {
    // Auth
    USER_ME = 'user-me',
    // Workout
    WORKOUTS = 'workouts',
    WORKOUT = 'workout',
    // Exercise
    EXERCISES = 'exercises',
    EXERCISE = 'exercise',
    // Running
    RUNS = 'runs',
    RUN = 'run',
    // Nutrition
    MEALS = 'meals',
    // Metrics
    METRICS = 'metrics',
    // Social
    FEED = 'feed',
    // Badges
    BADGES = 'badges',
    // Programs
    PROGRAMS = 'programs',
}
```

## Rules

1. **Zustand for client state only** — auth status, UI preferences, theme
2. **React Query for server state** — all API data
3. **Always select specific state** — `useStore(s => s.field)` not `useStore()`
4. **Query keys via enum** — centralized `Queries` enum
5. **Invalidate on mutation success** — keep data fresh
6. **Return semantic names** — `{ workouts, isLoading }` not `{ data, isLoading }`
7. **Actions end with `Action`** — `toggleThemeAction`, `setAuthenticatedAction`

## Anti-Patterns

- Storing server data in Zustand — use React Query
- Manual refetching after mutations — use invalidation
- Selecting entire store — always use selectors
- Mixing concerns in one slice — one domain per slice
