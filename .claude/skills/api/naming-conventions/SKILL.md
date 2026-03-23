---
name: naming-conventions
description: Defines consistent naming patterns for the API package — domain files (controllers, services, routes, types), migrations, database objects.
---

# API Naming Conventions Skill

## Purpose

Defines consistent naming patterns for the API package.

---

## Database Objects

### Tables

**`snake_case`, plural:**

```sql
✅ recipes
✅ recipe_ingredients
✅ meal_plans
✅ nutrition_facts

❌ Recipe
❌ recipeIngredients
❌ MealPlan
```

### Columns

**`snake_case`:**

```sql
✅ created_at
✅ user_id
✅ recipe_id
✅ is_published
✅ nutrition_per_serving

❌ createdAt
❌ userId
❌ isPublished
```

### RLS Policies

**`table_action_policy`:**

```sql
✅ recipes_select_policy
✅ recipes_insert_policy
✅ meal_plans_update_policy

❌ allowSelectRecipes
❌ recipe-read-policy
```

### Indexes

**`idx_table_column`:**

```sql
✅ idx_recipes_user_id
✅ idx_recipe_ingredients_recipe_id
✅ idx_meal_plans_date

❌ recipe_user_index
```

### Foreign Keys

**`fk_child_parent`:**

```sql
✅ fk_recipes_user_id
✅ fk_recipe_ingredients_recipe_id
✅ fk_recipe_ingredients_ingredient_id
```

### Enums (PostgreSQL)

**`snake_case`:**

```sql
✅ CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
✅ CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

❌ DifficultyLevel
❌ DIFFICULTY_LEVEL
```

---

## Migrations

**`NNNNN_verb_noun.sql`:**

```
✅ 00001_create_recipes.sql
✅ 00002_create_ingredients.sql
✅ 00010_add_nutrition_fields.sql
✅ 00015_alter_recipes_add_status.sql

❌ create-recipes.sql
❌ recipes.sql
❌ 1_recipes.sql
```

**Verbs:** `create`, `add`, `alter`, `drop`, `rename`, `seed`, `enable`

---

## Domain Files (src/domains/)

### Folders

**`kebab-case`:**

```
✅ src/domains/auth/
✅ src/domains/recipe/
✅ src/domains/meal-plan/
✅ src/domains/shopping-list/

❌ src/domains/MealPlan/
❌ src/domains/shoppingList/
```

### Files

**`domain.type.ts` pattern:**

```
✅ recipe.routes.ts
✅ recipe.controller.ts
✅ recipe.service.ts
✅ recipe.types.ts

❌ RecipeController.ts
❌ recipe-controller.ts
❌ recipeService.ts
```

### Export Names (PascalCase objects)

```typescript
// recipe.controller.ts → RecipeController
export const RecipeController = { getAll, getById, create, ... }

// recipe.service.ts → RecipeService
export const RecipeService = { getAll, getById, create, ... }

// recipe.routes.ts → recipeRoutes (Hono instance)
export const recipeRoutes = new Hono()
```

### Middleware & Helpers

```
✅ auth.middleware.ts      → authMiddleware
✅ response.helper.ts      → success(), error()
✅ validation.helper.ts    → validate()
```

---

## TypeScript Types (database.ts)

Auto-generated — never edit manually. When extending with custom types:

```typescript
// apps/api/src/types/recipe.types.ts
import { Database } from './database'

// Extract table row types
export type Recipe = Database['public']['Tables']['recipes']['Row']
export type RecipeInsert = Database['public']['Tables']['recipes']['Insert']
export type RecipeUpdate = Database['public']['Tables']['recipes']['Update']

// Custom composed types
export type RecipeWithIngredients = Recipe & {
  recipe_ingredients: RecipeIngredient[]
}
```

**Naming:**

| Kind | Pattern | Example |
|------|---------|---------|
| Row type | `TableName` (singular, PascalCase) | `Recipe`, `Ingredient` |
| Insert type | `TableNameInsert` | `RecipeInsert` |
| Update type | `TableNameUpdate` | `RecipeUpdate` |
| Composed type | `TableNameWith*` | `RecipeWithIngredients` |
| Enum type | `PascalCase` | `DifficultyLevel`, `MealType` |

---

## Summary Table

| Type | Pattern | Example |
|------|---------|---------|
| Domain folders | `kebab-case` | `meal-plan/` |
| Routes | `domain.routes.ts` | `recipe.routes.ts` |
| Controllers | `domain.controller.ts` | `recipe.controller.ts` |
| Services | `domain.service.ts` | `recipe.service.ts` |
| Types | `domain.types.ts` | `recipe.types.ts` |
| Middleware | `name.middleware.ts` | `auth.middleware.ts` |
| Helpers | `name.helper.ts` | `response.helper.ts` |
| Tables | `snake_case` plural | `recipes` |
| Columns | `snake_case` | `created_at` |
| RLS Policies | `table_action_policy` | `recipes_select_policy` |
| Indexes | `idx_table_column` | `idx_recipes_user_id` |
| Migrations | `NNNNN_verb_noun.sql` | `00001_create_recipes.sql` |
| TS Row types | `PascalCase` singular | `Recipe` |
| TS Insert types | `PascalCaseInsert` | `RecipeInsert` |
