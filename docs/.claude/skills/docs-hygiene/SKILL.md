---
name: docs-hygiene
description: Quarterly audit of docs/ — flags stale Implemented specs, orphan plans, broken FK between spec and plan, and runbooks past their last-tested window.
---

# docs-hygiene

Use quarterly, or on demand when the user says "audit docs", "find
stale specs", "check docs links".

## Mandate

`docs/` rots silently. This skill surfaces the rot.

## Checks

### 1. Spec ↔ plan FK

For every `spec.md` (and the legacy `auth.spec.md`), ensure
`frontmatter.plan` resolves to an existing file in the same folder. For
every `plan.md` (and `auth.plan.md`), ensure `frontmatter.spec` resolves.
Report mismatches as **broken FK**.

### 2. Status consistency

For every spec with `status: Implemented`:

- Grep the codebase for paths mentioned in the plan's `## File
  structure` section. If the majority no longer exist, flag the spec as
  **possibly zombie**.
- Confirm the domain README row matches the spec's frontmatter status.

### 3. Orphan plans

Any `plan.md` whose `spec:` points at a missing file → orphan plan.
Recommend recreating the spec or deleting the plan.

### 4. Domain README drift

For every `<bucket>/<domain>/README.md`, list the feature folders inside.
Each feature must appear as a row pointing at `<feature>/spec.md`, with
`status` matching the spec's frontmatter.

### 4a. Folder convention

Flag any `<feature>.spec.md` or `<feature>.plan.md` outside the legacy
`client/auth/` umbrella — new features must use folder layout, not flat
files.

### 5. Runbook freshness

For every runbook, compare `last-tested` to today. If older than 6
months and `severity` is high or critical → flag for re-test.

### 6. ADR referrers

For every ADR, scan all specs/plans that link to it. Update its
"Specs that reference this ADR" section to match reality.

### 7. Glossary drift

For every domain term used in specs (case-insensitive match against
`docs/glossary.md`), verify the term exists in the glossary. If a term
appears in 3+ specs but is missing from the glossary, flag for
addition.

## Output

A report grouped by check, with file paths and one-line actions.
Don't auto-fix — surface problems and let the human decide. After the
human resolves them, run again to confirm clean.
