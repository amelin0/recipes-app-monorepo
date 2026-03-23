---
name: web-naming-conventions
description: Defines consistent naming patterns for the Next.js admin panel — files, folders, components, hooks, API files, types, and routes.
---

# Web Naming Conventions Skill

## Purpose

Defines consistent naming patterns for the Next.js admin panel. Mirrors mobile conventions adapted for Next.js.

---

## Folder Naming

**Always `kebab-case`:**

```
✅ recipe-detail/
✅ meal-plans/
✅ user-profile/

❌ RecipeDetail/
❌ recipeDetail/
❌ recipe_detail/
```

---

## File Naming

### React Components (`.tsx`)

**`PascalCase` with descriptive suffix:**

```
✅ RecipesListScreen.tsx     # Screen
✅ RecipeDetailScreen.tsx
✅ Button.tsx                 # Component
✅ DataTable.tsx              # Widget
✅ RecipeCard.tsx             # Feature component

❌ recipesListScreen.tsx
❌ recipes-list-screen.tsx
```

### Screen Hooks

**`useScreenName.ts` pattern:**

```
✅ useRecipesListScreen.ts
✅ useRecipeDetailScreen.ts
✅ useLoginScreen.ts

❌ useRecipesList.ts          # too generic, conflicts with RQ hooks
❌ useRecipesListScreenHook.ts
```

### React Query Hooks

**`useCamelCase.ts` pattern:**

```
✅ useGetRecipes.ts
✅ useGetRecipe.ts
✅ useCreateRecipe.ts
✅ useUpdateRecipe.ts
✅ useDeleteRecipe.ts

❌ use-get-recipes.ts
❌ usegetrecipes.ts
```

### API Files

**`domain.type.ts` pattern:**

```
✅ recipe.api.ts
✅ recipe.types.ts
✅ recipe.mapper.ts          # optional

❌ RecipeApi.ts
❌ recipe-api.ts
```

### Zustand Slices

**`domain.slice.ts` pattern:**

```
✅ ui.slice.ts
✅ auth.slice.ts

❌ uiSlice.ts
❌ UISlice.ts
```

### Services & Helpers

**`name.type.ts` pattern:**

```
✅ date.helper.ts
✅ number.helper.ts
✅ string.helper.ts
✅ validation.util.ts
```

---

## Naming Inside Files

### Interfaces & Types

```typescript
// Domain models — clean names
interface Recipe { }
interface Ingredient { }
interface Category { }

// Request types — suffixed
interface RecipeCreateRequest { }
interface RecipeUpdateRequest { }

// Props interfaces
interface RecipeCardProps { }
interface DataTableProps<T> { }
```

### Zustand Slice Interface

```typescript
// Always ends with 'Slice'
export interface UiSlice { }

// Actions end with 'Action'
toggleSidebarAction: () => void
setActiveSectionAction: (section: string) => void
```

### React Query Hooks

```typescript
// Queries: useGet*, useList*
export const useGetRecipes = () => { }
export const useGetRecipe = (id: string) => { }

// Mutations: useCreate*, useUpdate*, useDelete*
export const useCreateRecipe = () => { }
export const useUpdateRecipe = () => { }
export const useDeleteRecipe = () => { }
```

### Constants

```typescript
// UPPER_SNAKE_CASE
const API_BASE_URL = ''
const MAX_PAGE_SIZE = 50

// Query keys
const QUERY_KEYS = {
  RECIPES: 'recipes',
  RECIPE: 'recipe',
  INGREDIENTS: 'ingredients',
}
```

---

## Next.js Route Naming

**`kebab-case` folder structure:**

```
app/
├── recipes/
│   ├── page.tsx              # /recipes
│   ├── new/page.tsx          # /recipes/new
│   └── [id]/
│       ├── page.tsx          # /recipes/:id
│       └── edit/page.tsx     # /recipes/:id/edit
├── meal-plans/
│   ├── page.tsx              # /meal-plans
│   └── [id]/page.tsx         # /meal-plans/:id
└── (auth)/
    └── login/page.tsx        # /login
```

---

## Summary Table

| Type | Pattern | Example |
|------|---------|---------|
| Folders | `kebab-case` | `recipe-detail/` |
| Screens | `PascalCaseScreen.tsx` | `RecipesListScreen.tsx` |
| Components | `PascalCase.tsx` | `Button.tsx` |
| Widgets | `PascalCase.tsx` | `DataTable.tsx` |
| Slices | `domain.slice.ts` | `ui.slice.ts` |
| RQ Hooks | `useCamelCase.ts` | `useGetRecipes.ts` |
| Screen Hooks | `useScreenName.ts` | `useRecipesListScreen.ts` |
| API | `domain.api.ts` | `recipe.api.ts` |
| Types | `domain.types.ts` | `recipe.types.ts` |
| Mappers | `domain.mapper.ts` | `recipe.mapper.ts` (optional) |
| Helpers | `name.helper.ts` | `date.helper.ts` |
| Routes | `kebab-case/page.tsx` | `meal-plans/page.tsx` |

---

## Barrel Exports

Each domain folder has `index.ts`:

```typescript
// src/view/recipes/index.ts
export { RecipesListScreen } from './recipes-list/RecipesListScreen';
export { RecipeDetailScreen } from './recipe-detail/RecipeDetailScreen';

// src/data/remote/domains/recipe/index.ts
export { RecipeApi } from './recipe.api';
export * from './recipe.types';

// src/state/domains/recipe/hooks/index.ts
export { useGetRecipes } from './useGetRecipes';
export { useGetRecipe } from './useGetRecipe';
export { useCreateRecipe } from './useCreateRecipe';
```
