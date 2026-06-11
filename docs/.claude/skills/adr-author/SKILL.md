---
name: adr-author
description: Gates ADR-worthiness, then guides authoring of an Architectural Decision Record. Activates when the user invokes /new-adr or edits a docs/adr/NNNN-*.md file.
---

# adr-author

Use when the user is creating or editing an ADR in `docs/adr/`.

## Mandate

ADRs are scarce by design. First **gate** whether this decision deserves
an ADR; then guide the writing.

## Gate (refuse if any of these are NO)

A decision is ADR-worthy when at least one is true:

- It rules out a credible alternative ("we picked X over Y").
- Reversing it later is expensive (data migration, large refactor,
  vendor lock-in).
- A new contributor would reasonably ask "why?" without reading the
  codebase.

If **none** apply, refuse and tell the user this is a routine choice
that follows from existing skills / conventions — no ADR needed.

## Auto-numbering

Run `ls docs/adr/NNNN-*.md | tail -1` to find the highest existing
number, increment by 1, zero-pad to 4 digits. Filename:
`NNNN-kebab-case-title.md`. Never reuse a number; never amend a merged
ADR's number.

## Workflow

1. **Frontmatter.** `id: ADR-NNNN`, `title:`, `status: Proposed`,
   `date: <today>`, `deciders:`.
2. **Context.** One paragraph. What forces are at play; what problem we
   solve; constraints; prior state. Resist longer than ~5 sentences.
3. **Decision.** One sentence stating the choice; one paragraph
   elaborating.
4. **Consequences.** Three buckets: easier / harder / hidden costs.
   Always include hidden costs — that's the most common omission.
5. **Alternatives considered.** At least 2. One bullet per alternative
   with a one-clause rejection reason. No alternatives = decision is
   probably not ADR-worthy (loop back to gate).
6. **Specs that reference this ADR.** Empty list at first; populated as
   specs cite it.

## Status transitions

- `Proposed` → `Accepted` when the PR merges.
- `Accepted` → `Superseded by ADR-NNNN` when a newer ADR replaces it.
  **Update the old ADR**; never delete it.
- `Accepted` → `Deprecated` when the choice no longer applies and there
  is no successor.

## Backlinks

When an ADR is cited from a spec or plan, add the spec/plan path under
"Specs that reference this ADR" so the lineage is bidirectional.
