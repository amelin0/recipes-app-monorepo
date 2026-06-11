# 08 - State Management

## Client State: Zustand

### Store (`store/index.ts`)

Combined store with slices pattern. Currently empty stub.

Planned slices:

- `auth.slice.ts` — `isAuthenticated`, auth actions
- `ui.slice.ts` — theme, onboarding state

### Slice Pattern

```typescript
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

Always select specific fields:

```typescript
const isAuthenticated = useStore(state => state.isAuthenticated);
```

## Server State: React Query

Configured in `App.tsx` with QueryClientProvider. Default config:

- Retry: 2
- Stale time: 5 minutes

Hooks per domain in `state/domains/{domain}/hooks/`.
