---
name: architecture
description: Defines the layered architecture of the DNS mobile app with clear separation of concerns. Covers folder structure, module boundaries, and dependency rules between layers.
---

# Architecture Skill

## Purpose

Defines the layered architecture of the DNS mobile app with clear separation of concerns.

## Architecture Overview

```
apps/mobile/src/
├── navigation/           # React Navigation setup
│   ├── RootNavigator.tsx
│   ├── BottomTabNavigator.tsx
│   └── stacks/           # Stack navigators per domain
│
├── screens/              # Screen components by domain
│   ├── home/
│   │   ├── HomeScreen.tsx
│   │   └── useHomeScreen.ts
│   ├── feed/
│   ├── record/
│   ├── programs/
│   └── profile/
│
├── components/           # Shared reusable components
│   ├── ui/               # Atomic UI (Button, Input, Card)
│   └── domain/           # Domain-specific composed components
│
├── hooks/                # Shared custom hooks
│
├── services/             # External integrations
│   ├── http.service.ts   # Axios instance
│   └── storage.service.ts
│
├── store/                # Client state (Zustand)
│   ├── index.ts          # Combined store
│   └── slices/           # Per-domain slices
│
├── data/                 # API layer
│   └── domains/          # Per-domain API + types
│       └── [domain]/
│           ├── [domain].api.ts
│           └── [domain].types.ts
│
├── state/                # Server state (React Query hooks)
│   └── domains/
│       └── [domain]/
│           └── hooks/    # useGetWorkout.ts, useCreateWorkout.ts
│
└── constants/            # App-level constants
```

## Layer Responsibilities

### Navigation Layer (`navigation/`)

- React Navigation setup (no Expo Router)
- RootNavigator wraps everything
- BottomTabNavigator: Home, Feed, Record, Programs, Profile
- Stack navigators per domain in `stacks/`

### Screens Layer (`screens/`)

- Organized by domain in kebab-case folders
- Each screen = `ScreenName.tsx` (presentation) + `useScreenName.ts` (logic)
- Screen component is purely presentational
- All logic, callbacks, data fetching orchestrated in the hook

### Components Layer (`components/`)

- `ui/` — Atomic, reusable (Button, Input, Card, Avatar, Badge)
- `domain/` — Domain-specific composed components (WorkoutCard, ExerciseItem)
- No business logic — receive data via props

### Services Layer (`services/`)

- HTTP client (Axios with interceptors)
- Storage service (MMKV/SecureStore)
- Analytics, push notifications
- No React — pure TypeScript

### Store Layer (`store/`)

- Zustand with slices pattern
- One slice per domain
- Only client-side state (auth status, UI preferences)
- Not for server data — use React Query for that

### Data Layer (`data/`)

- API methods: thin wrappers around HttpService
- Types: request/response TypeScript types
- One folder per domain
- No business logic

### State Layer (`state/`)

- React Query hooks per domain
- Query hooks (`useGet*`) for reading
- Mutation hooks (`useCreate*`, `useUpdate*`, `useDelete*`) for writing
- Handles caching, invalidation, loading states

## Dependency Rules

```
screens → state, store, components, hooks, services
state → data, services
store → (standalone, no deps)
data → services
components → (standalone, receive via props)
hooks → store, services
services → (standalone)
```

**Forbidden:**

- `data/` must NOT import from `screens/`, `state/`, `store/`
- `components/` must NOT import from `screens/` or `state/`
- `store/` must NOT import from `screens/`
- No circular dependencies between layers

## Anti-Patterns

- Putting API calls directly in screen components
- Using Zustand for server data (use React Query)
- Creating "god components" that handle both UI and logic
- Importing screen-specific code in shared components
