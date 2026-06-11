# Documentation zone

This `CLAUDE.md` governs the agent when working inside `docs/`. Code-level
conventions live in the **root** `CLAUDE.md` — not here.

## Where each kind of doc goes

| Need | Location | Template |
|---|---|---|
| Feature WHAT/WHY (user stories, FRs, success criteria) | `specs/<bucket>/<domain>/<feature>/spec.md` | [`templates/spec.md`](./templates/spec.md) |
| Feature HOW (DB, API, env, file structure) | `specs/<bucket>/<domain>/<feature>/plan.md` | [`templates/plan.md`](./templates/plan.md) |
| Architectural decision ("X over Y") | `adr/NNNN-*.md` | [`templates/adr.md`](./templates/adr.md) |
| Ops procedure | `runbooks/<verb-noun>.md` | [`templates/runbook.md`](./templates/runbook.md) |
| Domain index | `specs/<bucket>/<domain>/README.md` | [`templates/domain-readme.md`](./templates/domain-readme.md) |

## Spec buckets

- **`specs/client/`** — consumer-facing: Expo mobile app + client API (`apps/api/src/client/`)
- **`specs/admin/`** — internal staff: Next.js admin panel + admin API (`apps/api/src/admin/`)

## Slash commands (zonal — defined in `.claude/commands/`)

- `/new-spec <bucket>/<domain>/<feature>` — scaffold WHAT/WHY from `templates/spec.md`
- `/new-plan <path-to-spec>` — scaffold HOW next to an existing spec
- `/new-adr <title>` — scaffold ADR with auto-numbered ID
- `/new-runbook <name>` — scaffold runbook

## Skills (zonal — auto-trigger inside `docs/`)

- **`spec-author`** — section-by-section guidance for writing a spec
- **`plan-author`** — guidance for writing the technical plan
- **`adr-author`** — gates ADR-worthiness, then guides Context/Decision/Consequences
- **`runbook-author`** — guidance for ops procedure documentation
- **`docs-hygiene`** — quarterly audit: stale specs, orphan plans, broken FK

## Rules for the agent

1. Every file in `specs/`, `adr/`, `runbooks/` MUST have frontmatter that
   matches the contract in its template.
2. **Spec ≠ Plan.** Spec is technology-agnostic (no DB, no endpoints, no
   file paths). Plan is the technical mapping. Don't mix them. Every
   feature owns a folder `<feature>/` containing `spec.md` + `plan.md`
   (plus optional supporting artifacts: diagrams, research notes,
   screenshots). **Always a folder; no flat files.**
3. A feature that touches DB schema or API contract MUST have BOTH a spec
   and a plan. Throwaway UI-only fixes do not.
4. Plans cite Functional Requirements from the spec by ID (FR-NNN) for
   traceability.
5. When status changes — update `updated:` in frontmatter AND the row in
   `specs/<bucket>/<domain>/README.md`.
6. Don't duplicate root CLAUDE.md content here. If overlap is
   unavoidable, link instead of copy.
7. Don't write a spec for a bugfix, refactor, dependency bump, or cosmetic
   UI tweak — that's an anti-pattern.
8. ADR is warranted only when the decision (a) rules out a credible
   alternative, or (b) is expensive to reverse later. Skip routine choices.
9. When superseding an ADR, update the old one's status with a forward
   pointer; never delete.
10. Frontmatter FK between spec and plan (`plan:` / `spec:`) is **mandatory**
    and bidirectional — `docs-hygiene` will flag mismatches.
11. Linking: relative paths inside `docs/`; from outside `docs/` use paths
    rooted at the repo (`docs/specs/...`).
12. Add every new spec to its `<domain>/README.md` table. Add every new ADR
    to `adr/README.md` index.

## Status lifecycles

```
SPEC:   Draft → Approved → Implemented → (Deprecated | Superseded)
PLAN:   Draft → Approved → Implemented → Deprecated
ADR:    Proposed → Accepted → (Superseded by ADR-NNNN | Deprecated)
RUNBOOK: no formal status — `last-tested` date in frontmatter is the signal
```

Spec status changes when the **product contract** changes; plan status
changes when **code reality** changes. They evolve on independent clocks.

## Keeping docs in sync after code changes

After an implementation PR merges:

1. Bump `status:` (Draft → Implemented) and `updated:` on the feature's
   `plan.md`, and fix any code-reality drift (real migration filename vs
   planned name, real route paths, etc.).
2. Update the matching domain knowledge file under
   `.claude/knowledge/<domain>/` — that's what future Claude sessions read
   to understand what shipped and where the code lives.
3. Commit as a follow-up `chore(docs): sync docs after <feature>` so doc
   freshness stays a separate, trivially-reviewable change.
