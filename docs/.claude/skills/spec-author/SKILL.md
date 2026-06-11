---
name: spec-author
description: Section-by-section guidance for authoring a feature spec inside docs/specs/<bucket>/<domain>/<feature>/spec.md. Activates when the user is creating or editing a spec file.
---

# spec-author

Use when the user is creating or editing
`docs/specs/<bucket>/<domain>/<feature>/spec.md`.

## Mandate

Drive the spec from blank to a defensible Draft via section-by-section
prompting. Enforce the Spec Kit invariant: **technology-agnostic**.

## Folder convention

Every feature owns a folder
`docs/specs/<bucket>/<domain>/<feature>/` containing `spec.md` (this
file) and `plan.md`. Supporting artifacts (mermaid diagrams, research
notes, design exports) live in the same folder. **No flat files.**

The single legacy exception is
`docs/specs/client/auth/auth.spec.md` + `auth.plan.md` — left flat by
choice; new auth features (e.g. `auth/oauth-google/`) go into folders.

## Workflow

1. **Confirm bucket + domain.** Ask only if ambiguous. `client/` =
   consumer-facing (mobile app); `admin/` = internal staff. Refuse to start without it.
2. **User stories first.** Ask for the P1 user story before anything
   else. Insist on Given/When/Then acceptance scenarios — at least 2
   for P1, ≥1 for P2/P3.
3. **Functional Requirements.** Help the user write FR-001…FR-NNN as
   capabilities, not implementations. If they say "the system uses
   bcrypt", rewrite to "the system MUST hash passwords with a modern
   adaptive function" — bcrypt is a plan-level choice.
4. **Mark unknowns.** Anything fuzzy → `[NEEDS CLARIFICATION: …]`.
   These block moving to Approved; do not paper over them.
5. **Success Criteria.** Force measurable outcomes — time-to-complete,
   error rates, business metrics. Refuse hand-wavy "users will be happy".
6. **Edge Cases + Out of Scope + Assumptions.** Always populated.
   Empty Out of Scope is a smell — every feature has non-goals.
7. **Validate frontmatter.** `bucket`, `domain`, `status: Draft`,
   `owner`, `created`, `updated`, `plan: ./plan.md`. The file lives at
   `<feature>/spec.md`, never at `<feature>.spec.md`.
8. **Update the domain README.** Add the row pointing at
   `<feature>/spec.md` to `<bucket>/<domain>/README.md` — never forget
   this.

## Banned content in `spec.md`

- Database tables, columns, constraints
- HTTP methods or paths
- File paths inside `apps/` or `packages/`
- Library names ("uses bcrypt", "uses passport-jwt")
- Environment variable names
- Code snippets

These belong in `plan.md`. If the user pastes them into the spec,
redirect them to the plan.

## Allowed content

- User personas and journeys
- Functional requirements as capabilities
- Domain entities described in domain language
- Measurable success criteria
- Constraints expressed as outcomes ("must complete under N seconds")

## When the user is done

Offer to scaffold the plan with
`/new-plan docs/specs/<bucket>/<domain>/<feature>/spec.md`.
