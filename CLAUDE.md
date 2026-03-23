# Digital Nutrition Studio

Monorepo for the Digital Nutrition Studio platform — a recipe management and meal planning system.

## Monorepo Structure

```
recipes-app-monorepo/
├── apps/
│   ├── api/          # @dns/api — Supabase config, shared client, Edge Functions
│   ├── mobile/       # @dns/mobile — Expo React Native consumer app
│   └── web/          # @dns/web — Next.js admin panel
├── packages/         # Shared packages (future)
└── .claude/
    ├── skills/
    │   ├── mobile/   # React Native / Expo skills (from bidel-mobile-app)
    │   ├── api/      # Custom API (Hono + Edge Functions) skills
    │   └── web/      # Next.js admin panel skills
    ├── knowledge/    # Domain knowledge
    └── commands/     # Custom Claude commands
```

## Tech Stack

| App | Stack |
|-----|-------|
| `@dns/api` | Supabase (PostgreSQL, Auth, Storage), Hono (API router), Edge Functions, Deno |
| `@dns/web` | Next.js 16, React 19, Tailwind CSS v4, TypeScript |
| `@dns/mobile` | Expo SDK 55, React Native 0.83, TypeScript |

## Package Manager

**pnpm** — always use pnpm, never npm or yarn.

## Architecture

All apps follow **domain-driven architecture**.

### API (backend)
Custom HTTP API via Supabase Edge Functions + Hono router. Split by role:

```
apps/api/src/
├── admin/              # Admin-facing endpoints (web panel)
│   ├── auth/           # POST /api/admin/auth/login
│   ├── users/          # GET /api/admin/users/all
│   └── router.ts       # authMiddleware + adminMiddleware applied globally
├── client/             # User-facing endpoints (mobile app)
│   ├── auth/           # POST /api/auth/login, /api/auth/register
│   ├── users/          # GET /api/users/me
│   └── router.ts
├── shared/
│   ├── services/       # Shared business logic (AuthService, UserService)
│   ├── middleware/      # authMiddleware, adminMiddleware
│   ├── helpers/        # response.helper.ts
│   └── supabase.ts     # Admin client (service_role)
├── router.ts           # Main router: / → client, /admin → admin
└── types/database.ts   # Auto-generated DB types
```

Each domain folder has: `domain.controller.ts`, `domain.routes.ts`, `index.ts`.
Services are shared — business logic lives in `shared/services/`, not duplicated per role.
Clients never query DB directly — all data goes through the API.

### Roles
- **USER** — mobile app user (default on register)
- **ADMIN** — admin panel access
- **SUPER_ADMIN** — full access

### Mobile & Web (frontend)
Layered separation:
- **data/** — HTTP calls to API (no direct Supabase queries)
- **state/** — React Query hooks + Zustand slices
- **view/** — Screens/pages (presentation only)
- **shared/** — Cross-cutting: UI components, helpers, hooks, services

### Key Rules

1. **Screen = View + Hook** — every screen has `ScreenName.tsx` (JSX only) + `useScreenName.ts` (all logic)
2. **Domain-driven** — code organized by business domain (recipe, ingredient, user, etc.)
3. **Barrel exports** — every folder has `index.ts`
4. **No business logic in routing layer** — route files only import screens from `view/`
5. **API-first** — mobile/web call our API, not Supabase SDK directly

### File Naming

| Type | Pattern | Example |
|------|---------|---------|
| Folders | `kebab-case` | `recipe-detail/` |
| Screens | `PascalCaseScreen.tsx` | `RecipesListScreen.tsx` |
| Screen Hooks | `useScreenName.ts` | `useRecipesListScreen.ts` |
| Components | `PascalCase.tsx` | `Button.tsx` |
| API files | `domain.api.ts` | `recipe.api.ts` |
| Type files | `domain.types.ts` | `recipe.types.ts` |
| Slices | `domain.slice.ts` | `auth.slice.ts` |
| RQ Hooks | `useCamelCase.ts` | `useGetRecipes.ts` |
| Services | `name.service.ts` | `http.service.ts` |
| Helpers | `name.helper.ts` | `date.helper.ts` |

## Environment Variables

All env vars defined in `.env.example`:

**Supabase keys (API backend only):**
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (Edge Functions)

**API URL (clients):**
- `NEXT_PUBLIC_API_URL` — API URL for web (Next.js)
- `EXPO_PUBLIC_API_URL` — API URL for mobile (Expo)

Mobile and web do NOT use Supabase SDK directly — they call our API via HTTP.

## Common Commands

```bash
pnpm dev:web          # Start Next.js dev server
pnpm dev:mobile       # Start Expo dev server
pnpm dev:api          # Start local Supabase
pnpm build:web        # Build Next.js
pnpm generate:types   # Regenerate Supabase DB types
pnpm db:push          # Push migrations to Supabase
pnpm db:reset         # Reset local database
```

## Design System

Colors:
- **olive**: primary green palette (50–800)
- **peach**: accent warm palette (50–800)

Fonts:
- **Manrope** — headings
- **Inter** — body text

## Knowledge

See `.claude/knowledge/` for project context:

### General
- `01-project-description.md` — product vision, version roadmap (V1/V2/V3), design principles, typography, colors, navigation

### Domain features (each feature = separate file)
- `auth/` — login.md, register.md
- `user/` — get-me.md, get-all.md, settings.md, weight.md
- `nutrition/` — set-goal.md, get-daily.md
- `recipe/` — overview.md (CRUD, tags, ingredients, filters, i18n translations)
- `shopping-list/` — overview.md (add recipe → auto-aggregate ingredients, toggle checked)

Each feature file describes: endpoints, request/response, logic flow (controller → service → DB), middleware, DB relationships.

## Skills

See `.claude/skills/` for coding patterns per app:

### mobile/
- `architecture/` — layered arch: app → view → state → data → shared
- `naming-conventions/` — file & export naming (kebab-case folders, PascalCase screens, domain.api.ts, useScreenName.ts)
- `data-layer/` — API pattern (domain.api.ts, domain.types.ts, domain.mapper.ts)
- `state-management/` — Zustand slices + React Query hooks
- `screens/` — screen + useScreen hook pattern
- `components/` — UI components catalog
- `react-native-best-practices/` — performance, bundle, animations
- `vercel-react-rules/` — React Native rules from Vercel
- `native-modules/` — Expo modules, Turbo Modules
- `styles/` — React Native Unistyles 3 (theme, breakpoints, variants)
- `widgets/` — composed UI components
- `upgrading-expo/` — Expo SDK upgrade guides
- `expo-deployment/` — EAS Build, App Store, Play Store
- `expo-cicd-workflows/` — CI/CD with GitHub Actions
- `localization/` — i18next patterns
- `callstack-skills/` — GitHub & GitHub Actions best practices

### api/
- `architecture/` — Custom API via Edge Functions + Hono. Role-based split: admin/ + client/ + shared/services/
- `naming-conventions/` — domain files (domain.controller.ts, domain.routes.ts, domain.admin-routes.ts), DB objects (snake_case), migrations (NNNNN_verb_noun.sql)

### web/
- `architecture/` — Next.js App Router with same data/state/view separation as mobile
- `naming-conventions/` — mirrors mobile conventions adapted for Next.js routes
- `data-layer/` — HTTP calls to API (domain.api.ts via HttpService)
- `state-management/` — React Query hooks + optional Zustand for UI state
