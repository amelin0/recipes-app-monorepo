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
    │   ├── api/      # Supabase / Edge Functions skills
    │   └── web/      # Next.js admin panel skills
    ├── knowledge/    # Domain knowledge
    └── commands/     # Custom Claude commands
```

## Tech Stack

| App | Stack |
|-----|-------|
| `@dns/api` | Supabase (PostgreSQL, Edge Functions, Auth, RLS) |
| `@dns/web` | Next.js 16, React 19, Tailwind CSS v4, TypeScript |
| `@dns/mobile` | Expo SDK 55, React Native 0.83, TypeScript |

## Package Manager

**pnpm** — always use pnpm, never npm or yarn.

## Architecture

All apps follow **domain-driven architecture** with layered separation:

- **data/** — API calls + types (no business logic)
- **state/** — React Query hooks + Zustand slices (data fetching + caching)
- **view/** — Screens/pages (presentation only)
- **shared/** — Cross-cutting: UI components, helpers, hooks, services

### Key Rules

1. **Screen = View + Hook** — every screen has `ScreenName.tsx` (JSX only) + `useScreenName.ts` (all logic)
2. **Domain-driven** — code organized by business domain (recipe, ingredient, user, etc.)
3. **Barrel exports** — every folder has `index.ts`
4. **No business logic in routing layer** — route files only import screens from `view/`

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
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side only)

Web uses `NEXT_PUBLIC_SUPABASE_*` prefix.
Mobile uses `EXPO_PUBLIC_SUPABASE_*` prefix.

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
- `01-project-description.md` — product vision, version roadmap (V1/V2/V3), design principles, typography, colors, navigation
- `02-domains.md` — domain breakdown across all versions with data/state/view layers per domain

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
- `styles/` — Uniwind/Tailwind patterns
- `widgets/` — composed UI components
- `upgrading-expo/` — Expo SDK upgrade guides
- `expo-deployment/` — EAS Build, App Store, Play Store
- `expo-cicd-workflows/` — CI/CD with GitHub Actions
- `localization/` — i18next patterns
- `callstack-skills/` — GitHub & GitHub Actions best practices

### api/
- `architecture/` — Supabase project structure (migrations, Edge Functions, RLS, type generation)
- `naming-conventions/` — DB objects (snake_case tables/columns), migrations (NNNNN_verb_noun.sql), Edge Functions (domain-action/)

### web/
- `architecture/` — Next.js App Router with same data/state/view separation as mobile
- `naming-conventions/` — mirrors mobile conventions adapted for Next.js routes
- `data-layer/` — Supabase queries (domain.api.ts with supabase.from().select())
- `state-management/` — React Query hooks + optional Zustand for UI state
