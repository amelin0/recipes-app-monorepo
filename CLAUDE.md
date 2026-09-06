# Digital Nutrition Studio

Monorepo for the Digital Nutrition Studio (DNS) platform — a recipe management
and meal planning system. Structure mirrors the 11am-app reference monorepo.

## Monorepo Structure

```
recipes-app-monorepo/
├── apps/
│   ├── client-api/   # @dns/client-api — NestJS API for the mobile app (port 3000)
│   ├── admin-api/    # @dns/admin-api — NestJS API for the admin panel (port 3001)
│   ├── mobile/       # @dns/mobile — RationFit: Expo app (Unistyles), screens ship domain by domain
│   └── web/          # @dns/web — Next.js admin panel (working)
├── packages/         # Shared workspaces: shared-types, validation, constants,
│                     #   utils, database, api-common, api-infrastructure
│                     #   — see packages/CLAUDE.md
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
| `@dns/client-api` | NestJS 11 + Drizzle + nestjs-zod + passport-jwt (PostgreSQL, Redis, MinIO) |
| `@dns/admin-api` | Same stack as client-api, separate service and JWT secrets |
| `@dns/web` | Next.js 16, React 19, Tailwind CSS v4, TypeScript |
| `@dns/mobile` | Expo SDK 55 + React Native 0.83 + expo-router + **react-native-unistyles 3** (NOT Uniwind) |

Local infrastructure: `docker-compose.yml` — postgres:16, redis:7, MinIO (S3).

The two APIs are **separate services over one shared database**
(`@dns/database`). The admin service carries no `/admin` path prefix — the
port distinguishes them. See [ADR-0002](docs/adr/0002-split-client-and-admin-api.md)
and [ADR-0003](docs/adr/0003-auth-model-tokens-and-admin-permissions.md).

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
pnpm dev:mobile       # Start mobile dev (see apps/mobile/CLAUDE.md — Metro port caveat)
pnpm dev:client-api   # Start client API dev (:3000, Swagger on /docs)
pnpm dev:admin-api    # Start admin API dev (:3001, Swagger on /docs)
pnpm build:web        # Build Next.js
pnpm deploy:web       # Deploy web to Vercel (production)
pnpm lint             # Lint all workspaces
pnpm typecheck        # Typecheck all workspaces
pnpm format           # Prettier write
pnpm db:generate      # drizzle-kit: generate migration from schema changes
pnpm db:migrate       # Run DB migrations
pnpm db:studio        # drizzle-kit studio
docker compose up -d  # Local postgres + redis + MinIO
```

## Design System

WARNING: mobile and web currently run **different palettes**. Do not copy tokens
between them, and do not "align" one to the other without asking.

### Mobile — source of truth: **RFDS Figma** (`oLpxjnx4DEZdTv5eTyE2Hv`)
- Colors: node `54617:1222` (light theme) -> `apps/mobile/src/shared/ui/theme/colors.ts`
- Typography: node `54617:1678`, **Inter only** -> `typography.ts`
- Applied via `StyleSheet.create(theme => ({...}))` (react-native-unistyles), never `className`
- Key colors: `branding.primary #1E2932`, `branding.accent #5EBA12`,
  `semantic.darkGrey #8C8C8C`, `positive #00AB3C`, `negative #FF0021`, `ocean #2B7FFF`
- `.claude/knowledge/design-tokens.md` is **outdated for mobile** — ignore it there

### Web — older palette, unchanged
- `apps/web/src/app/globals.css` — Tailwind `@theme` with CSS custom properties
- primary olive `#6B8F3C`, accent peach `#D4956A`;
  macro: protein `#6B8F3C`, carbs `#D4956A`, fats `#5B9BD5`, calories `#8BA651`
- Usage: `bg-primary-default`, `text-text-secondary`, `border-border-default`
- Fonts: **Manrope** headings (`--font-heading`), **Inter** body (`--font-sans`)

## Docs

`docs/` is the single source of truth for product specs:
- `docs/specs/<bucket>/<domain>/<feature>/` — `spec.md` (WHAT/WHY) + `plan.md` (HOW)
- Buckets: `client/` (mobile + client API), `admin/` (admin panel + admin API)
- **Mobile screens built from Figma ship `spec.md` only** (frontmatter `plan: null`) —
  the backend developer turns the spec into schema + endpoints. See
  "Screen delivery workflow" in `apps/mobile/CLAUDE.md`.
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
