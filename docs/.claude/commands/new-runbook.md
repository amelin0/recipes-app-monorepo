---
description: Scaffold a new ops runbook from templates/runbook.md
argument-hint: <verb-noun>
---

Create a new runbook at `docs/runbooks/$ARGUMENTS.md`.

Steps:

1. Trigger the `runbook-author` skill to gate whether a runbook is
   warranted (recurring on-call task, recovery procedure, manual ops
   step needing repeatability).
2. Validate `$ARGUMENTS` follows `<verb-noun>` kebab-case
   (`restore-db`, `rotate-jwt-secret`, `redeploy-api`).
3. Copy `docs/templates/runbook.md` to `docs/runbooks/$ARGUMENTS.md`.
4. Fill the frontmatter:
   - `title:` — title-case of `$ARGUMENTS`
   - `severity:` — ask the user; default `medium`
   - `owner:` — `@oncall` by default
   - `last-tested:` — leave as YYYY-MM-DD until first dry-run
5. Add a row to `docs/runbooks/README.md` Index.
6. Continue with `runbook-author` to walk When-to-use → Prerequisites
   → Steps → Verification → Rollback → Postmortem hooks.
7. Remind the user to update `last-tested` after a successful dry-run
   in staging.
