---
name: runbook-author
description: Guidance for documenting an operational procedure as a runbook. Activates on /new-runbook or when editing docs/runbooks/*.md.
---

# runbook-author

Use when the user is creating or editing a runbook in `docs/runbooks/`.

## Mandate

A runbook is a procedure executable **under stress, by someone who isn't
the author**, after an alert page. Optimize for that persona.

## Gate

Write a runbook when:

- A production incident just happened and the recovery wasn't obvious.
- A manual procedure (key rotation, DB restore, prod deploy hotfix)
  needs to be doable by someone other than the author.
- An on-call task is repeated more than twice.

## Workflow

1. **Filename.** `<verb-noun>.md` — `restore-db.md`,
   `rotate-jwt-secret.md`. Verb first, kebab-case, no dates, no
   incident IDs.
2. **Frontmatter.** `title`, `severity` (low/medium/high/critical),
   `owner` (e.g. `@oncall`), `last-tested` date.
3. **When to use this.** Symptoms, alert names, observable triggers.
   The on-call must recognize this is the right runbook in <30 seconds.
4. **Prerequisites.** Access (which dashboards, vaults, clusters);
   tools installed; secrets at known paths. Numbered if order matters.
5. **Steps.** Numbered. Each step is one action. Include the exact
   command — do not summarize. Include expected output where it
   confirms progress.
6. **Verification.** How the on-call knows the procedure worked.
   Specific signals: a metric returning to baseline, a query returning
   N rows, a health endpoint going green.
7. **Rollback.** What to do if step N fails. If the procedure is
   one-way (e.g. data deletion), say so and require explicit
   confirmation in the steps.
8. **Postmortem hooks.** Always present: open Linear issue with
   `incident` label; page on-call after a duration threshold; update
   the related spec/plan if the incident exposed drift.

## Test before publishing

Run the runbook end-to-end in staging. Update `last-tested` only after
a successful dry run. Outdated `last-tested` is a smell during
quarterly hygiene.
