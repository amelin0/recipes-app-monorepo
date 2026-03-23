---
name: web-data-layer
description: Patterns for Supabase data access in the Next.js admin panel. Covers domain.api.ts, domain.types.ts, optional mappers, and server vs client Supabase usage.
---

# Web Data Layer Skill

## Purpose

Defines patterns for Supabase data access in the Next.js admin panel.

---

## Structure

```
data/
├── remote/
│   └── domains/
│       ├── recipe/
│       │   ├── recipe.api.ts
│       │   ├── recipe.types.ts
│       │   ├── recipe.mapper.ts   ← optional
│       │   └── index.ts
│       ├── ingredient/
│       │   ├── ingredient.api.ts
│       │   ├── ingredient.types.ts
│       │   └── index.ts
│       ├── category/
│       ├── tag/
│       ├── meal-plan/
│       ├── user/
│       └── index.ts
└── index.ts
```

---

## API Pattern (Supabase)

```typescript
// src/data/remote/domains/recipe/recipe.api.ts
import { supabase } from '@dns/api';
import { RecipeInsert, RecipeUpdate } from './recipe.types';

export const RecipeApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*, categories(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*, recipe_ingredients(*, ingredients(*)), categories(*), tags(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (recipe: RecipeInsert) => {
    const { data, error } = await supabase
      .from('recipes')
      .insert(recipe)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: RecipeUpdate) => {
    const { data, error } = await supabase
      .from('recipes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
```

---

## Types File

```typescript
// src/data/remote/domains/recipe/recipe.types.ts
import { Database } from '@dns/api';

type Tables = Database['public']['Tables'];

export type Recipe = Tables['recipes']['Row'];
export type RecipeInsert = Tables['recipes']['Insert'];
export type RecipeUpdate = Tables['recipes']['Update'];

export type RecipeWithIngredients = Recipe & {
  recipe_ingredients: (Tables['recipe_ingredients']['Row'] & {
    ingredients: Tables['ingredients']['Row'];
  })[];
  categories: Tables['categories']['Row'] | null;
  tags: Tables['tags']['Row'][];
};
```

---

## Mapper (optional)

Only create when transformation is needed:

```typescript
// src/data/remote/domains/recipe/recipe.mapper.ts
import { RecipeWithIngredients } from './recipe.types';

export interface RecipeViewModel {
  id: string;
  title: string;
  totalCalories: number;    // ← computed
  ingredientCount: number;  // ← computed
  categoryName: string;     // ← flattened
}

export const recipeMapper = {
  toViewModel: (recipe: RecipeWithIngredients): RecipeViewModel => ({
    id: recipe.id,
    title: recipe.title,
    totalCalories: recipe.recipe_ingredients.reduce(
      (sum, ri) => sum + (ri.ingredients.calories ?? 0) * ri.amount,
      0
    ),
    ingredientCount: recipe.recipe_ingredients.length,
    categoryName: recipe.categories?.name ?? 'Uncategorized',
  }),
};
```

---

## File Naming Conventions

| Pattern | Example | Purpose |
|---------|---------|---------|
| `[domain].api.ts` | `recipe.api.ts` | Supabase queries |
| `[domain].types.ts` | `recipe.types.ts` | Types (Row, Insert, Update) |
| `[domain].mapper.ts` | `recipe.mapper.ts` | Transformation (optional) |

---

## Barrel Exports

```typescript
// src/data/remote/domains/recipe/index.ts
export { RecipeApi } from './recipe.api';
export * from './recipe.types';

// src/data/index.ts
export * from './remote/domains/recipe';
export * from './remote/domains/ingredient';
export * from './remote/domains/category';
```
