# Digital Nutrition Studio

Monorepo for the Digital Nutrition Studio (DNS) platform — a recipe management
and meal planning system. Structure mirrors the 11am-app reference monorepo.

## Monorepo Structure

```
recipes-app-monorepo/
├── apps/
│   ├── api/          # @dns/api — EMPTY: backend will be written by the backend developer
│   ├── mobile/       # @dns/mobile — EMPTY: Expo app will be rebuilt (Uniwind Pro styling)
│   └── web/          # @dns/web — Next.js admin panel (working)
├── packages/         # Shared workspaces (planned: shared-types, validation,
│                     #   constants, utils, database) — see packages/CLAUDE.md
├── docs/             # Specs (spec.md + plan.md per feature), ADRs, runbooks
├── scripts/          # minio-init.sh for docker-compose
└── .claude/
    ├── skills/
    │   ├── mobile/   # React Native / Expo skills (from 11am-app reference)
    │   └── web/      # Next.js admin panel skills
    ├── agents/       # Review/refactor agents (typescript-reviewer, tdd-guide, …)
    ├── knowledge/    # Domain knowledge (endpoints contracts from V1 — reference for the new API)
    └── commands/     # Custom Claude commands
```

## Tech Stack

| App | Stack |
|-----|-------|
| `@dns/api` | TBD by backend developer (reference: NestJS + PostgreSQL + Redis + MinIO, as in 11am-app) |
| `@dns/web` | Next.js 16, React 19, Tailwind CSS v4, TypeScript |
| `@dns/mobile` | TBD: Expo + React Native + Uniwind Pro (Tailwind v4 className), as in 11am-app |

Local infrastructure: `docker-compose.yml` — postgres:16, redis:7, MinIO (S3).

## Package Manager

**pnpm** — always use pnpm, never npm or yarn. Workspaces: `apps/*`, `packages/*`.

## Architecture

All apps follow **domain-driven architecture**.

### Roles
- **USER** — mobile app user (default on register)
- **ADMIN** — admin panel access
- **SUPER_ADMIN** — full access

### Mobile & Web (frontend)
Layered separation:
- **data/** — HTTP calls to API (no direct DB queries)
- **state/** — React Query hooks + Zustand slices
- **view/** — Screens/pages (presentation only)
- **shared/** — Cross-cutting: UI components, helpers, hooks, services

### Key Rules

1. **Screen = View + Hook** — every screen has `ScreenName.tsx` (JSX only) + `useScreenName.ts` (all logic)
2. **Domain-driven** — code organized by business domain (recipe, ingredient, user, etc.)
3. **Barrel exports** — every folder has `index.ts`
4. **No business logic in routing layer** — route files only import screens from `view/`
5. **API-first** — mobile/web call our API over HTTP, never the DB directly

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

All env vars defined in `.env.example`: PostgreSQL, Redis, JWT, S3/MinIO for
the API; `NEXT_PUBLIC_API_URL` (web) and `EXPO_PUBLIC_API_URL` (mobile) for
clients. Mobile and web call the API via HTTP only.

## Common Commands

```bash
pnpm dev:web          # Start Next.js dev server
pnpm dev:mobile       # Start mobile dev (once @dns/mobile exists)
pnpm dev:api          # Start API dev (once @dns/api exists)
pnpm build:web        # Build Next.js
pnpm deploy:web       # Deploy web to Vercel (production)
pnpm lint             # Lint all workspaces
pnpm typecheck        # Typecheck all workspaces
pnpm format           # Prettier write
pnpm db:generate      # Drizzle/ORM codegen (once @dns/database exists)
pnpm db:migrate       # Run DB migrations (once @dns/database exists)
docker compose up -d  # Local postgres + redis + MinIO
```

## Design System

Semantic token system — identical naming across web (Tailwind CSS vars) and mobile.

Full token reference: `.claude/knowledge/design-tokens.md`

### Key colors
- **primary** (olive green `#6B8F3C`) — buttons, active states, links, progress rings
- **accent** (peach `#D4956A`) — highlights, carbs indicator
- **macro** — protein `#6B8F3C`, carbs `#D4956A`, fats `#5B9BD5`, calories `#8BA651`

### Usage patterns
- Web: `bg-primary-default`, `text-text-secondary`, `border-border-default`
- Mobile (Uniwind): tokens defined in `apps/mobile/src/global.css`, used via `className`

### Files
- Web: `apps/web/src/app/globals.css` — Tailwind `@theme` with CSS custom properties

### Fonts
- **Manrope** — headings (`--font-heading`)
- **Inter** — body text (`--font-sans`)

## Docs

`docs/` is the single source of truth for product specs:
- `docs/specs/<bucket>/<domain>/<feature>/` — `spec.md` (WHAT/WHY) + `plan.md` (HOW)
- Buckets: `client/` (mobile + client API), `admin/` (admin panel + admin API)
- Zonal commands inside `docs/`: `/new-spec`, `/new-plan`, `/new-adr`, `/new-runbook`
- See `docs/CLAUDE.md` for the rules

## Knowledge

See `.claude/knowledge/` for project context:

### General
- `01-project-description.md` — product vision, version roadmap (V1/V2/V3), design principles, typography, colors, navigation

### Domain features (each feature = separate file)
- `auth/`, `user/`, `nutrition/`, `recipe/`, `product/`, `shopping-list/`, `meal-plan/`

> ⚠️ Feature files describe the V1 API contracts (endpoints, request/response,
> DB relationships) built on the old Supabase backend. The backend is being
> rewritten — treat these as the product contract reference, not as a
> description of current code.

- `mobile/` — reference codebase knowledge from 11am-app (services, hooks,
  components, styling, state management, data layer, libs)

## Skills

See `.claude/skills/` for coding patterns per app:

### mobile/
Patterns from the 11am-app reference (architecture, naming-conventions,
data-layer, state-management, screens, components, widgets, styles (Uniwind),
icons, localization, accessibility, e2e (Maestro), tdd-workflow,
mobile-app-security, mobile-analytics-monitoring, mobile-cicd-devops,
mobile-debugging-profiling, real-time-features) plus Expo guides
(expo-deployment, expo-cicd-workflows, upgrading-expo, native-modules,
react-native-best-practices, vercel-react-rules, callstack-skills).

### web/
- `architecture/` — Next.js App Router with same data/state/view separation as mobile
- `naming-conventions/` — mirrors mobile conventions adapted for Next.js routes (Page instead of Screen)
- `data-layer/` — HTTP calls to API (domain.api.ts via HttpService)
- `state-management/` — React Query hooks + Zustand for auth/UI state
- `react-best-practices/` — 65 Vercel rules: waterfalls, bundle, SSR, re-renders, JS perf
- `composition-patterns/` — compound components, avoid boolean props, React 19 patterns
- `web-design-guidelines.md` — 100+ UI audit rules: a11y, forms, animations, i18n

## Agents

See `.claude/agents/` — code-refactorer, component-auditor,
performance-optimizer, refactor-cleaner, security-reviewer,
silent-failure-hunter, tdd-guide, typescript-reviewer.
