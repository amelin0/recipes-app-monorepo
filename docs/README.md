# DNS Documentation

Project documentation for the Digital Nutrition Studio monorepo.
This folder is the **single source of truth** for product specs,
architectural decisions, and operational procedures.

For code-level conventions (naming, dependency policy, per-app rules)
see the root [`CLAUDE.md`](../CLAUDE.md).

## Map

| You want to … | Go to |
|---|---|
| Read or write a feature spec | [`specs/`](./specs) |
| See why we made a decision | [`adr/`](./adr) |
| Run an ops procedure | [`runbooks/`](./runbooks) |
| Start a new doc | [`templates/`](./templates) |

## Spec organization

Specs are split by **user persona**, not by app:

- **[`specs/client/`](./specs/client)** — consumer-facing surfaces: the
  Expo mobile app + the client API (`apps/client-api/src/`).
- **[`specs/admin/`](./specs/admin)** — internal staff surfaces: the
  Next.js admin panel + the admin API (`apps/admin-api/src/`).
  Separate auth model (ADMIN / SUPER_ADMIN roles).

Each feature lives in its own folder
`specs/<bucket>/<domain>/<feature>/` containing two parallel documents:

- **`spec.md`** — WHAT and WHY (Spec Kit-style: user stories, FRs,
  success criteria, technology-agnostic)
- **`plan.md`** — HOW (DB schema, API contract, env vars, file structure,
  security)

Supporting artifacts (mermaid diagrams, research notes, exported Figma
images) live in the same folder and stay tied to the feature.

## Spec lifecycle

```
[1] DRAFT spec → [2] APPROVED (PR-merge) → [3] IMPLEMENTED (MVP shipped)
                                              │
                                              ↓
                                        DEPRECATED / SUPERSEDED
```

Plans evolve on their own clock — they're updated whenever code reality
diverges from the document. See [`CLAUDE.md`](./CLAUDE.md) for the full
status lifecycles.

## What does NOT belong here

| Content | Goes in |
|---|---|
| Code conventions, naming, dependency policy | Root `CLAUDE.md` |
| Conditional how-to guides | `.claude/skills/` |
| Current code state snapshots | `.claude/knowledge/` |
| Personal scratch | `CLAUDE.local.md` (gitignored) |
| Changelog | `git log` + Conventional Commits |
| Release notes | GitHub Releases |
