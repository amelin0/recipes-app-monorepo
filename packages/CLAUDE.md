# DNS Shared Packages

## Overview

All packages are internal workspaces consumed by `apps/api` and `apps/mobile`
(web consumes API over HTTP only). Each package exports through `src/index.ts`.

> Currently empty — packages are created by the backend developer as the
> API takes shape. The intended split mirrors the 11am-app reference:

## Planned packages

### @dns/shared-types

- TypeScript types, interfaces, and enums
- **No runtime code** — types only
- Used for API contracts between backend and mobile

### @dns/validation

- Zod schemas for data validation
- Shared between API (request validation) and Mobile (form validation)
- Each schema file = one domain

### @dns/constants

- Static data: enums, config values, magic numbers
- Must be pure values — no side effects, no imports from other packages

### @dns/utils

- Pure utility functions shared across apps

### @dns/database

- DB schema + migrations + seed scripts
- Owns `db:generate`, `db:migrate`, `db:studio`, `db:seed` scripts
  referenced from the root `package.json`

### @dns/api-common / @dns/api-infrastructure

- Backend-only shared modules (guards, interceptors, infra adapters)

## Rules

1. Packages never import from `apps/*`.
2. `shared-types` and `constants` stay runtime-free.
3. Every package exports only through `src/index.ts`.
