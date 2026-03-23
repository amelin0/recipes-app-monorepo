---
name: architecture
description: Custom API architecture with Edge Functions as HTTP endpoints. Domain-driven structure with controllers, services, and routes using Hono router. Supabase for DB, Auth, Storage.
---

# API Architecture Skill

## Purpose

Defines the custom API architecture: Edge Functions as a full HTTP API layer with domain-driven organization (controllers, services, routes). Supabase handles DB, Auth, and Storage — but all data access goes through our API, not direct client SDK calls.

## Philosophy

```
┌──────────────────────────────────────────────────────────┐
│                  Mobile / Web Client                     │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTP requests
                         ▼
┌──────────────────────────────────────────────────────────┐
│              Edge Function — API Gateway                 │
│                                                          │
│  ┌─────────┐  ┌────────────┐  ┌───────────┐             │
│  │ Routes  │→ │ Controller │→ │  Service  │             │
│  │         │  │ (validate) │  │ (business │             │
│  │         │  │            │  │  logic)   │             │
│  └─────────┘  └────────────┘  └─────┬─────┘             │
│                                      │                   │
│              ┌───────────────────────┘                   │
│              ▼                                           │
│  ┌────────────────────────────┐                          │
│  │   Supabase Admin Client   │                          │
│  │   (service_role key)      │                          │
│  └────────────────────────────┘                          │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│           PostgreSQL + RLS (optional layer)              │
└──────────────────────────────────────────────────────────┘
```

**Clients never talk to DB directly.** All requests go through our API.

---

## Folder Structure

```
apps/api/
├── src/
│   ├── domains/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts          # Hono route definitions
│   │   │   ├── auth.controller.ts      # Request handling, validation
│   │   │   ├── auth.service.ts         # Business logic, DB queries
│   │   │   ├── auth.types.ts           # Domain types, request/response shapes
│   │   │   └── index.ts               # Barrel export
│   │   ├── recipe/
│   │   │   ├── recipe.routes.ts
│   │   │   ├── recipe.controller.ts
│   │   │   ├── recipe.service.ts
│   │   │   ├── recipe.types.ts
│   │   │   └── index.ts
│   │   ├── ingredient/
│   │   ├── category/
│   │   ├── tag/
│   │   ├── meal-plan/
│   │   ├── shopping-list/
│   │   └── user/
│   │
│   ├── shared/
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts      # JWT verification, user context
│   │   ├── helpers/
│   │   │   ├── response.helper.ts      # Standardized API responses
│   │   │   └── validation.helper.ts    # Zod schema helpers
│   │   └── supabase.ts                # Admin client (service_role)
│   │
│   ├── router.ts                       # Main Hono app, mounts all domain routes
│   ├── client.ts                       # Public client export (for web/mobile)
│   ├── index.ts                        # Barrel re-export
│   └── types/
│       └── database.ts                 # Auto-generated DB types
│
├── supabase/
│   ├── functions/
│   │   └── api/
│   │       └── index.ts               # Entry point: Deno.serve(app.fetch)
│   ├── migrations/
│   ├── seed.sql
│   └── config.toml
│
├── deno.json                           # Import map for Deno
├── package.json
└── tsconfig.json
```

---

## Layer Responsibilities

### Routes (`domain.routes.ts`)

Defines HTTP endpoints. No logic — just wires paths to controllers.

```typescript
// src/domains/recipe/recipe.routes.ts
import { Hono } from 'hono'
import { authMiddleware } from '../../shared/middleware/auth.middleware.ts'
import { RecipeController } from './recipe.controller.ts'

const recipeRoutes = new Hono()

recipeRoutes.get('/', RecipeController.getAll)
recipeRoutes.get('/:id', RecipeController.getById)
recipeRoutes.post('/', authMiddleware, RecipeController.create)
recipeRoutes.put('/:id', authMiddleware, RecipeController.update)
recipeRoutes.delete('/:id', authMiddleware, RecipeController.delete)

export { recipeRoutes }
```

---

### Controller (`domain.controller.ts`)

Handles HTTP request/response. Validates input, calls service, returns response. No DB queries here.

```typescript
// src/domains/recipe/recipe.controller.ts
import { Context } from 'hono'
import { RecipeService } from './recipe.service.ts'
import { CreateRecipeRequest } from './recipe.types.ts'
import { success, error } from '../../shared/helpers/response.helper.ts'

export const RecipeController = {
  getAll: async (c: Context) => {
    const { category, tag, search, page, limit } = c.req.query()
    const data = await RecipeService.getAll({ category, tag, search, page: Number(page), limit: Number(limit) })
    return success(c, data)
  },

  getById: async (c: Context) => {
    const id = c.req.param('id')
    const data = await RecipeService.getById(id)
    if (!data) return error(c, 'Recipe not found', 404)
    return success(c, data)
  },

  create: async (c: Context) => {
    const body = await c.req.json<CreateRecipeRequest>()
    // validate with Zod here
    const userId = c.get('userId')
    const data = await RecipeService.create(userId, body)
    return success(c, data, 201)
  },

  update: async (c: Context) => {
    const id = c.req.param('id')
    const body = await c.req.json()
    const userId = c.get('userId')
    const data = await RecipeService.update(id, userId, body)
    return success(c, data)
  },

  delete: async (c: Context) => {
    const id = c.req.param('id')
    const userId = c.get('userId')
    await RecipeService.delete(id, userId)
    return success(c, null, 204)
  },
}
```

---

### Service (`domain.service.ts`)

All business logic and DB queries. Uses Supabase admin client.

```typescript
// src/domains/recipe/recipe.service.ts
import { supabaseAdmin } from '../../shared/supabase.ts'
import { CreateRecipeRequest, RecipeFilters } from './recipe.types.ts'

export const RecipeService = {
  getAll: async (filters: RecipeFilters) => {
    let query = supabaseAdmin
      .from('recipes')
      .select('*, categories(*), recipe_tags(tags(*))')
      .order('created_at', { ascending: false })

    if (filters.category) query = query.eq('category_id', filters.category)
    if (filters.search) query = query.ilike('title', `%${filters.search}%`)
    if (filters.limit) query = query.limit(filters.limit)

    const { data, error } = await query
    if (error) throw error
    return data
  },

  getById: async (id: string) => {
    const { data, error } = await supabaseAdmin
      .from('recipes')
      .select('*, recipe_ingredients(*, ingredients(*)), categories(*), recipe_tags(tags(*))')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  create: async (userId: string, input: CreateRecipeRequest) => {
    const { data, error } = await supabaseAdmin
      .from('recipes')
      .insert({ ...input, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return data
  },

  update: async (id: string, userId: string, input: Partial<CreateRecipeRequest>) => {
    const { data, error } = await supabaseAdmin
      .from('recipes')
      .update(input)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  delete: async (id: string, userId: string) => {
    const { error } = await supabaseAdmin
      .from('recipes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error
  },
}
```

---

### Types (`domain.types.ts`)

Request/response types, filters, domain models.

```typescript
// src/domains/recipe/recipe.types.ts
import { Database } from '../../types/database.ts'

type Tables = Database['public']['Tables']

export type Recipe = Tables['recipes']['Row']
export type RecipeInsert = Tables['recipes']['Insert']
export type RecipeUpdate = Tables['recipes']['Update']

export interface CreateRecipeRequest {
  title: string
  description?: string
  instructions: string
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  category_id: string
  image_url?: string
}

export interface RecipeFilters {
  category?: string
  tag?: string
  search?: string
  page?: number
  limit?: number
}
```

---

## Shared Code

### Main Router (`src/router.ts`)

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authRoutes } from './domains/auth/index.ts'
import { recipeRoutes } from './domains/recipe/index.ts'
import { ingredientRoutes } from './domains/ingredient/index.ts'
import { categoryRoutes } from './domains/category/index.ts'
import { tagRoutes } from './domains/tag/index.ts'
import { mealPlanRoutes } from './domains/meal-plan/index.ts'
import { shoppingListRoutes } from './domains/shopping-list/index.ts'
import { userRoutes } from './domains/user/index.ts'

const app = new Hono().basePath('/api')

app.use('*', cors())

app.route('/auth', authRoutes)
app.route('/recipes', recipeRoutes)
app.route('/ingredients', ingredientRoutes)
app.route('/categories', categoryRoutes)
app.route('/tags', tagRoutes)
app.route('/meal-plans', mealPlanRoutes)
app.route('/shopping-lists', shoppingListRoutes)
app.route('/users', userRoutes)

export { app }
```

### Supabase Admin Client (`src/shared/supabase.ts`)

```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database.ts'

export const supabaseAdmin = createClient<Database>(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)
```

### Auth Middleware (`src/shared/middleware/auth.middleware.ts`)

```typescript
import { Context, Next } from 'hono'
import { supabaseAdmin } from '../supabase.ts'

export const authMiddleware = async (c: Context, next: Next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return c.json({ error: 'Unauthorized' }, 401)

  c.set('userId', user.id)
  c.set('user', user)
  await next()
}
```

### Response Helper (`src/shared/helpers/response.helper.ts`)

```typescript
import { Context } from 'hono'

export const success = (c: Context, data: unknown, status = 200) => {
  return c.json({ success: true, data }, status)
}

export const error = (c: Context, message: string, status = 400) => {
  return c.json({ success: false, error: message }, status)
}
```

---

## Edge Function Entry Point

```typescript
// supabase/functions/api/index.ts
import { app } from '../../src/router.ts'

Deno.serve(app.fetch)
```

---

## Dependency Flow

```
Routes → Controller → Service → Supabase Admin Client → PostgreSQL
                ↓
          Validation (Zod)
```

**Rules:**
1. Routes only wire paths to controllers
2. Controllers handle HTTP (request parsing, validation, response formatting)
3. Services contain all business logic and DB queries
4. Services use `supabaseAdmin` (service_role) — not the public client
5. Shared middleware handles auth, CORS, error handling
6. Types are co-located with their domain

---

## Client-Side Usage

Mobile and web call the API via HTTP, not Supabase SDK directly:

```typescript
// apps/mobile/src/data/remote/domains/recipe/recipe.api.ts
import { HttpService } from '@/shared/services'

export const RecipeApi = {
  getAll: (filters?: RecipeFilters) =>
    HttpService.get<Recipe[]>('/api/recipes', { params: filters }),

  getById: (id: string) =>
    HttpService.get<Recipe>(`/api/recipes/${id}`),

  create: (data: CreateRecipeRequest) =>
    HttpService.post<Recipe>('/api/recipes', data),
}
```

---

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Routes | `domain.routes.ts` | `recipe.routes.ts` |
| Controllers | `domain.controller.ts` | `recipe.controller.ts` |
| Services | `domain.service.ts` | `recipe.service.ts` |
| Types | `domain.types.ts` | `recipe.types.ts` |
| Middleware | `name.middleware.ts` | `auth.middleware.ts` |
| Helpers | `name.helper.ts` | `response.helper.ts` |
| Migrations | `NNNNN_verb_noun.sql` | `00001_create_recipes.sql` |
