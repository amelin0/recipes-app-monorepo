---
name: plan-author
description: Guidance for writing the technical plan (plan.md) that maps a spec onto the codebase. Activates when the user is creating or editing docs/specs/<bucket>/<domain>/<feature>/plan.md.
---

# plan-author

Use when the user is creating or editing
`docs/specs/<bucket>/<domain>/<feature>/plan.md`.

## Mandate

Map the spec onto concrete code: DB schema, API contract, env vars,
file structure, security, rollout. Every claim in the plan should be
grounded in a Functional Requirement from the spec.

## Pre-flight

1. **The spec must exist** at `./spec.md` (same folder) and be in
   `Draft` or later. If not, refuse and instruct the user to write the
   spec first.
2. **Read the spec.** Specifically the Functional Requirements section.
   The plan exists to satisfy those FRs.
3. **Validate frontmatter FK.** `spec: ./spec.md` must point to an
   existing file in the same folder.

## Workflow

1. **Summary.** One paragraph mapping FRs to code areas + key technical
   decisions, citing ADRs where they exist.
2. **Database.** New tables, columns, types, constraints, indexes,
   foreign keys, RLS notes if applicable. Migration filenames.
3. **API contract.** One subsection per endpoint. Method, path, auth
   guard, request body table (field/type/required/validation), response
   schema, error codes. Reference `@dns/validation` schema names.
4. **Environment variables.** Table form. Required column matters.
5. **File structure.** Tree of files that will appear or change.
   Include `apps/<app>/...` and `packages/<pkg>/...`. Use this as the
   PR breakdown unit.
6. **Shared contract.** Which Zod schemas / types / constants land in
   `@dns/validation`, `@dns/shared-types`, `@dns/constants`, and
   which clients consume them.
7. **Security & edge cases.** Hashing, rate limits, enumeration,
   idempotency, race conditions, authz boundaries.
8. **Rollout.** Feature flag, deploy order (BE → mobile → web),
   backwards-compat window.
9. **Verification.** Tests covering FR-NNN, smoke endpoints, metrics
   to watch.

## Trigger an ADR

If the plan introduces a non-trivial choice that future contributors
will reasonably ask "why?" about, suggest writing an ADR via
`/new-adr <title>` and link from `related-adrs:` in the plan
frontmatter.

## When code reality diverges

Update the plan in the **same PR** that introduces the divergence.
Never let plan drift; the plan is the source of truth for HOW until it
isn't.
