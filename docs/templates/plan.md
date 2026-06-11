---
spec: ./spec.md
status: Draft
owner: '@username'
created: YYYY-MM-DD
updated: YYYY-MM-DD
related-adrs: []
related-runbooks: []
---

# Plan: <Feature Name>

> **Folder convention:** lives next to `spec.md` inside
> `docs/specs/<bucket>/<domain>/<feature>/`.
>
> **Purpose:** technical mapping of [./spec.md](./spec.md) onto the
> codebase. Describes **HOW** we implement: DB, API, env vars, file
> structure, security, rollout. Updated when reality diverges from the
> document.

## Summary

One paragraph: which FRs from the spec map to which code areas + key
technical decisions referenced from ADRs.

## Database

### Table `<name>`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `<col>` | `<type>` | `<constraints>` |

Indexes:
- `<idx_name>` on `(<cols>)` — <reason>

Relations:
- `<col>` → `<other_table>.id` ON DELETE <action>

### Migrations

- `NNNN_<name>.sql` — <one-line summary>

## API contract

### `<METHOD> /<path>`

**Auth:** `<authMiddleware | adminMiddleware | none>| none>`

**Request body:**

```json
{ "field": "value" }
```

| Field | Type | Required | Validation |
|---|---|---|---|

**Response 2xx:**

```json
{ "field": "value" }
```

**Errors:**

- `<status>` — <reason>

*(Repeat per endpoint.)*

## Environment variables

| Variable | Description | Required | Default |
|---|---|---|---|

## File structure

Files that will appear / change:

```
apps/api/src/client/<x>/...          # or apps/api/src/admin/<x>/...
apps/api/src/shared/services/<x>.service.ts
apps/mobile/src/data/<x>/ + state/<x>/ + view/<x>/
apps/web/src/...
```

## Shared contract

Types / Zod schemas / constants added to `@dns/shared-types`,
`@dns/validation`, `@dns/constants` — and which clients consume them
(api, mobile, web).

## Security & edge cases

- Hashing / rate-limiting / enumeration prevention / race conditions
- Auth/authz boundaries
- Idempotency / retry behavior
- Input validation surface

## Rollout

- Feature flag: `<name>` (or "none")
- Migration order: BE deploy → mobile release → web release
- Backwards compatibility window: <duration>

## Verification

How we know it works in production:

- Unit / integration / e2e tests covering FR-NNN
- Smoke endpoints to hit after deploy
- Metrics / dashboards to watch

## Related

- Spec: [./spec.md](./spec.md)
- ADRs: <links>
- Runbooks: <links>
