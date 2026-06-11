---
description: Scaffold a technical plan next to an existing spec
argument-hint: <path-to-spec>
---

Create a technical plan for the spec at `$ARGUMENTS`.

Steps:

1. Validate that `$ARGUMENTS` is an existing spec file at
   `docs/specs/<bucket>/<domain>/<feature>/spec.md`. Refuse otherwise.
2. Read the spec's frontmatter. Extract `title`, `owner`, `bucket`,
   `domain`, and the list of Functional Requirements (FR-NNN…).
3. Compute the plan path: same folder, `plan.md`. So
   `docs/specs/<bucket>/<domain>/<feature>/plan.md`.
4. If the plan already exists, refuse and tell the user to edit it
   directly.
5. Copy `docs/templates/plan.md` to the plan path.
6. Fill the frontmatter:
   - `spec: ./spec.md`
   - `status: Draft`
   - `owner:` — same as spec
   - `created:` and `updated:` — today's date
7. In the spec's frontmatter, ensure `plan: ./plan.md` points at the
   new plan (it should already, but verify).
8. Trigger the `plan-author` skill — guide the user to fill the plan,
   citing FR-NNN from the spec for traceability.
9. Suggest running `/new-adr <title>` if the plan involves a non-routine
   technical decision.
