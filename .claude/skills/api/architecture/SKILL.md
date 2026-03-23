---
name: api-architecture
description: Defines the domain-driven architecture for the Supabase API layer. Covers folder structure, Edge Functions, database types, and domain organization.
---

# API Architecture Skill

## Purpose

Defines the domain-driven architecture for the Supabase API package (shared config + Edge Functions).

## Architecture Overview

```
apps/api/
├── src/
│   ├── client.ts                  # Supabase client export
│   ├── index.ts                   # Barrel re-export
│   └── types/
│       └── database.ts            # Auto-generated DB types (supabase gen types)
│
├── supabase/
│   ├── config.toml                # Supabase project config
│   ├── migrations/                # SQL migrations by domain
│   │   ├── 00001_create_recipes.sql
│   │   ├── 00002_create_ingredients.sql
│   │   └── ...
│   ├── seed.sql                   # Seed data
│   └── functions/                 # Edge Functions by domain
│       └── [domain]-[action]/
│           └── index.ts
│
├── package.json
└── tsconfig.json
```

---

## Domain Organization

### Migrations

Migrations are organized sequentially but grouped logically by domain:

```
migrations/
├── 00001_create_profiles.sql        # auth domain
├── 00002_create_categories.sql      # recipe domain
├── 00003_create_tags.sql            # recipe domain
├── 00004_create_ingredients.sql     # ingredient domain
├── 00005_create_recipes.sql         # recipe domain
├── 00006_create_recipe_ingredients.sql  # recipe domain
├── 00007_create_meal_plans.sql      # meal-plan domain
└── 00008_create_rls_policies.sql    # security
```

**Naming:** `NNNNN_verb_noun.sql` (e.g., `00001_create_recipes.sql`, `00010_add_nutrition_fields.sql`)

### Edge Functions

Each Edge Function is a standalone Deno module in its own folder:

```
functions/
├── recipe-create/
│   └── index.ts
├── recipe-calculate-nutrition/
│   └── index.ts
├── meal-plan-generate/
│   └── index.ts
└── ingredient-import/
    └── index.ts
```

**Naming:** `[domain]-[action]/index.ts` (kebab-case)

---

## Shared Client

The `src/client.ts` provides a typed Supabase client shared by `@dns/web` and `@dns/mobile`:

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database'

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)
```

Both apps import via workspace dependency:
```typescript
import { supabase, Database } from '@dns/api'
```

---

## Type Generation

Database types are auto-generated — never edit `database.ts` manually:

```bash
pnpm generate:types
# → supabase gen types --lang=typescript --local > apps/api/src/types/database.ts
```

---

## RLS Policies

Row Level Security policies follow domain boundaries:

```sql
-- Each table has its own RLS policy
-- Naming: [table]_[action]_policy
CREATE POLICY recipes_select_policy ON recipes FOR SELECT USING (true);
CREATE POLICY recipes_insert_policy ON recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY recipes_update_policy ON recipes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY recipes_delete_policy ON recipes FOR DELETE USING (auth.uid() = user_id);
```

---

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Migrations | `NNNNN_verb_noun.sql` | `00001_create_recipes.sql` |
| Edge Functions | `domain-action/index.ts` | `recipe-create/index.ts` |
| Types | `domain.ts` | `database.ts` |
| Client | `client.ts` | `client.ts` |
