---
name: web-state-management
description: Patterns for managing state in the Next.js admin panel with React Query hooks (server state) and optional Zustand slices (client state). Same conventions as mobile.
---

# Web State Management Skill

## Purpose

Defines patterns for managing state in the Next.js admin panel using React Query and Zustand.

---

## Structure

```
state/
├── domains/
│   ├── recipe/
│   │   ├── hooks/
│   │   │   ├── useGetRecipes.ts
│   │   │   ├── useGetRecipe.ts
│   │   │   ├── useCreateRecipe.ts
│   │   │   ├── useUpdateRecipe.ts
│   │   │   ├── useDeleteRecipe.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── ingredient/
│   ├── category/
│   ├── user/
│   └── index.ts
├── store.ts                    # Combined Zustand store (if needed)
└── index.ts
```

---

## State Strategy

| Type | Tool | Location |
|------|------|----------|
| Server data (recipes, users) | React Query | `hooks/useGet*.ts` |
| Mutations (CRUD) | React Query | `hooks/useCreate*.ts` |
| UI state (sidebar, filters) | Zustand | `*.slice.ts` |

---

## Query Hook (GET list)

```typescript
// src/state/domains/recipe/hooks/useGetRecipes.ts
import { useQuery } from '@tanstack/react-query';
import { RecipeApi } from '@/data';

export const useGetRecipes = () => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['recipes'],
    queryFn: RecipeApi.getAll,
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

## Query Hook (GET single)

```typescript
// src/state/domains/recipe/hooks/useGetRecipe.ts
import { useQuery } from '@tanstack/react-query';
import { RecipeApi } from '@/data';

export const useGetRecipe = (id: string) => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => RecipeApi.getById(id),
    enabled: !!id,
  });

  return {
    recipe: data ?? null,
    isLoading,
    isError,
    error,
    refetch,
  };
};
```

## Mutation Hook

```typescript
// src/state/domains/recipe/hooks/useCreateRecipe.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RecipeApi, RecipeInsert } from '@/data';

export const useCreateRecipe = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isSuccess, error } = useMutation({
    mutationFn: (data: RecipeInsert) => RecipeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });

  return {
    createRecipe: mutateAsync,
    isPending,
    isSuccess,
    error,
  };
};
```

## Mutation with optimistic update

```typescript
// src/state/domains/recipe/hooks/useDeleteRecipe.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RecipeApi } from '@/data';

export const useDeleteRecipe = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: (id: string) => RecipeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });

  return {
    deleteRecipe: mutateAsync,
    isPending,
    error,
  };
};
```

---

## Zustand (UI state only)

```typescript
// src/state/domains/ui/ui.slice.ts
import { StateCreator } from 'zustand';

export interface UiSlice {
  isSidebarCollapsed: boolean;
  activeSection: string | null;
  toggleSidebarAction: () => void;
  setActiveSectionAction: (section: string | null) => void;
}

export const createUiSlice: StateCreator<UiSlice, [], [], UiSlice> = set => ({
  isSidebarCollapsed: false,
  activeSection: null,
  toggleSidebarAction: () => set(s => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
  setActiveSectionAction: activeSection => set(() => ({ activeSection })),
});
```

---

## Barrel Exports

```typescript
// src/state/domains/recipe/hooks/index.ts
export { useGetRecipes } from './useGetRecipes';
export { useGetRecipe } from './useGetRecipe';
export { useCreateRecipe } from './useCreateRecipe';
export { useUpdateRecipe } from './useUpdateRecipe';
export { useDeleteRecipe } from './useDeleteRecipe';

// src/state/domains/recipe/index.ts
export * from './hooks';

// src/state/index.ts
export * from './domains/recipe';
export * from './domains/ingredient';
```

---

## Usage — Screen Hooks

Screens NEVER use React Query hooks directly:

```typescript
// src/view/recipes/recipes-list/useRecipesListScreen.ts
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGetRecipes } from '@/state/domains/recipe';
import { useDeleteRecipe } from '@/state/domains/recipe';

export const useRecipesListScreen = () => {
  const router = useRouter();
  const { recipes, isLoading } = useGetRecipes();
  const { deleteRecipe, isPending: isDeleting } = useDeleteRecipe();
  const [search, setSearch] = useState('');

  const filteredRecipes = recipes.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = useCallback(() => {
    router.push('/recipes/new');
  }, [router]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteRecipe(id);
  }, [deleteRecipe]);

  return {
    recipes: filteredRecipes,
    isLoading,
    isDeleting,
    search,
    setSearch,
    handleCreate,
    handleDelete,
  };
};
```
