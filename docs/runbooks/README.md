# Runbooks

Step-by-step ops procedures: how to do a thing under stress, with someone watching. Each runbook is one Markdown file.

## When to write one

- A production incident just happened and the recovery wasn't obvious.
- A manual procedure (key rotation, DB restore, prod deploy hotfix) needs to be doable by someone who isn't you.
- An on-call task is repeated more than twice.

## Format

Use [`../templates/runbook.md`](../templates/runbook.md) (or run
`/new-runbook <name>`). Filename: `<verb-noun>.md`
(e.g. `restore-db.md`, `rotate-jwt-secret.md`).

## Index

<!-- Update this list when adding a new runbook. -->

- _(none yet)_
