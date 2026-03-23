---
name: web-architecture
description: Defines the domain-driven architecture for the Next.js admin panel. Mirrors the mobile app's data/state/view separation adapted for Next.js App Router with server components.
---

# Web Architecture Skill

## Purpose

Defines the domain-driven architecture for the Next.js admin panel, mirroring the mobile app's layered approach (data → state → view) adapted for Next.js App Router.

## Architecture Overview

```
apps/web/src/
├── app/                           # Next.js App Router (file-based routing)
│   ├── layout.tsx                 # Root layout (providers, fonts, sidebar)
│   ├── page.tsx                   # Dashboard
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── recipes/
│   │   ├── page.tsx               # List
│   │   ├── [id]/page.tsx          # Detail
│   │   └── new/page.tsx           # Create
│   ├── ingredients/
│   ├── categories/
│   ├── tags/
│   ├── meal-plans/
│   └── users/
│
├── view/                          # Presentation layer (by domain)
│   └── [domain]/
│       └── [screen]/
│           ├── ScreenName.tsx     # Presentational component
│           ├── useScreenName.ts   # All logic — state, handlers
│           └── components/        # Screen-specific components
│
├── shared/
│   ├── ui/
│   │   ├── components/            # Simple reusable (Button, Input, Badge, etc.)
│   │   └── widgets/               # Composed (DataTable, SearchFilter, etc.)
│   ├── hooks/                     # Shared React hooks
│   ├── helpers/                   # Pure functions
│   └── constants/
│
├── data/
│   └── remote/
│       └── domains/
│           └── [domain]/
│               ├── [domain].api.ts      # Supabase queries
│               ├── [domain].types.ts    # Types
│               └── [domain].mapper.ts   # Optional mapper
│
├── state/
│   └── domains/
│       └── [domain]/
│           ├── hooks/
│           │   ├── useGetRecipes.ts     # React Query hooks
│           │   └── useCreateRecipe.ts
│           └── [domain].slice.ts        # Zustand slice (if needed)
│
├── lib/
│   └── supabase/
│       ├── server.ts              # Server-side Supabase client
│       └── client.ts             # Browser-side Supabase client
│
└── middleware.ts                  # Auth session refresh
```

---

## Layer Responsibilities

### 1. App Layer (`src/app/`)

**Purpose:** File-based routing via Next.js App Router. Route files are thin.

```typescript
// src/app/recipes/page.tsx
import { RecipesListScreen } from '@/view/recipes';

export default function RecipesPage() {
  return <RecipesListScreen />;
}
```

**Rules:**
- Route files only import and export screens from `view/`
- `layout.tsx` handles providers and navigation shell
- No business logic in app layer
- Server Components by default; add `"use client"` only when needed

---

### 2. View Layer (`src/view/`)

**Purpose:** UI screens organized by domain. Same pattern as mobile.

```
view/
├── recipes/
│   ├── recipes-list/
│   │   ├── RecipesListScreen.tsx
│   │   ├── useRecipesListScreen.ts
│   │   └── components/
│   │       └── RecipeCard.tsx
│   ├── recipe-detail/
│   │   ├── RecipeDetailScreen.tsx
│   │   └── useRecipeDetailScreen.ts
│   └── index.ts
├── ingredients/
├── categories/
└── users/
```

**Rules:**
- **Every screen has a `useScreenName.ts` hook** — no exceptions
- Screen component is purely presentational
- No `useState`, `useCallback`, `useMutation` directly in screens
- Screen-specific components in `components/` subfolder
- Barrel exports (`index.ts`)

---

### 3. Data Layer (`src/data/`)

**Purpose:** Supabase queries and types. Uses Supabase client instead of Axios.

```typescript
// src/data/remote/domains/recipe/recipe.api.ts
import { supabase } from '@dns/api';

export const RecipeApi = {
  getRecipes: async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*, categories(*), tags(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  getRecipe: async (id: string) => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*, recipe_ingredients(*, ingredients(*))')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  createRecipe: async (recipe: RecipeInsert) => {
    const { data, error } = await supabase
      .from('recipes')
      .insert(recipe)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
```

---

### 4. State Layer (`src/state/`)

**Purpose:** React Query hooks + optional Zustand slices.

```typescript
// src/state/domains/recipe/hooks/useGetRecipes.ts
import { useQuery } from '@tanstack/react-query';
import { RecipeApi } from '@/data';

export const useGetRecipes = () => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['recipes'],
    queryFn: RecipeApi.getRecipes,
  });

  return {
    recipes: data ?? [],
    isLoading,
    isError,
    error,
    refetch,
  };
};
```

---

## Dependency Flow

```
┌─────────────────────────────────────────────────────────┐
│                   App (Next.js Router)                  │
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
└───────────┬───────────┘     │  • hooks                  │
            ▼                 │  • helpers                 │
┌───────────────────────┐     └───────────────────────────┘
│        Data           │                 ▲
│  • remote/domains     │─────────────────┘
│  (Supabase queries)   │
└───────────────────────┘
```

**Rules:**
1. App → View (imports screens)
2. View → State, Shared
3. State hooks → Data APIs
4. Data → Supabase client from `@dns/api`
5. Shared has no dependencies on other layers
