# DNS Shared Packages

## Overview

All packages are internal workspaces consumed by `apps/client-api`,
`apps/admin-api` and `apps/mobile` (web consumes the API over HTTP only).
Each package exports through `src/index.ts`.

The split mirrors the 11am-app reference.

## Packages

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

### @dns/api-common

- Backend-only cross-cutting NestJS building blocks shared by both APIs:
  `GlobalExceptionFilter`, `ResponseInterceptor` (`{ data: T }` envelope),
  `CustomThrottlerGuard` + `@SetThrottleKey`, pino logger config

### @dns/api-infrastructure

- Dynamic modules for external infrastructure, subpath-exported:
  `email/` (Resend, stub client when `RESEND_API_KEY` is absent), `otp/`,
  `oauth/` (Apple, Google), `storage/` (S3 / MinIO presigned URLs)
- Each follows the `forRootAsync` pattern

## Rules

1. Packages never import from `apps/*`.
2. `shared-types` and `constants` stay runtime-free.
3. Every package exports only through `src/index.ts`.
