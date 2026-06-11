# Feature specs

Every feature lives in its own folder
`specs/<bucket>/<domain>/<feature>/` containing two parallel documents:

- **`spec.md`** — Specification. WHAT users need and WHY.
  Technology-agnostic (no DB schema, no endpoints, no file paths).
  Modeled after the [GitHub Spec Kit spec template](https://github.com/github/spec-kit).
- **`plan.md`** — Plan. HOW we implement it: DB, API, env vars,
  file structure, security, rollout.

Supporting artifacts (mermaid diagrams, research notes, exported Figma
images) live in the same folder and stay tied to the feature.

Frontmatter fields `plan: ./plan.md` (in spec) and `spec: ./spec.md`
(in plan) form a two-way link.

## Buckets

- **[`client/`](./client)** — consumer-facing: Expo mobile app + client API
- **[`admin/`](./admin)** — internal staff: Next.js admin panel + admin API

## How to start a new spec

1. `/new-spec <bucket>/<domain>/<feature>` — creates the folder
   `specs/<bucket>/<domain>/<feature>/` and scaffolds `spec.md` inside
   it from [`../templates/spec.md`](../templates/spec.md).
2. Fill it section-by-section. Don't skip sections marked `(mandatory)`.
3. Mark unclear items as `[NEEDS CLARIFICATION: …]` — these block moving
   to `Approved`.
4. PR `docs(specs/<bucket>/<domain>): add <feature> spec` (Status: Draft).
5. After review → status `Approved`. Add a row to the domain `README.md`.
6. Run `/new-plan docs/specs/<bucket>/<domain>/<feature>/spec.md` to
   scaffold `plan.md` in the same folder.
7. Plan PR'd separately (or together — your call), references FR-NNN.
8. Implementation PRs reference the spec; on merge, status → `Implemented`.

## Folder shape

```
docs/specs/<bucket>/<domain>/<feature>/
├── spec.md           # WHAT and WHY (mandatory)
├── plan.md           # HOW (mandatory once code begins)
├── flow.mmd          # optional mermaid diagram
├── research.md       # optional research notes
└── figma-export.png  # optional design exports
```

**Always a folder.** No flat `<feature>.spec.md` files.

## Status lifecycle

```
SPEC:   Draft → Approved → Implemented → (Deprecated | Superseded)
PLAN:   Draft → Approved → Implemented → Deprecated
```

A status change is just a `docs(...): mark <feature> as Implemented` commit
that bumps `status:` and `updated:` in frontmatter and updates the row in
the domain `README.md`.

## When NOT to write a spec

- Bugfix
- Refactor without contract change
- UI tweak / copy edit
- Dependency bump
- Cosmetic style change

These are anti-patterns. Specs are for new contracts (DB, API, behavior),
not for PRs that just touch existing code.
