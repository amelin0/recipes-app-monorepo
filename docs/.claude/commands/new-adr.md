---
description: Scaffold a new Architectural Decision Record with auto-numbered ID
argument-hint: <kebab-case-title>
---

Create a new ADR at `docs/adr/NNNN-$ARGUMENTS.md`.

Steps:

1. Trigger the `adr-author` skill **first** to gate ADR-worthiness.
   If the proposed decision is routine (no credible alternative ruled
   out, cheap to reverse), refuse and explain why.
2. Compute the next number: `ls docs/adr/[0-9]*.md` and increment the
   highest. Zero-pad to 4 digits.
3. Validate `$ARGUMENTS` is kebab-case (`a-z0-9-`).
4. Filename: `docs/adr/NNNN-$ARGUMENTS.md`.
5. Copy `docs/templates/adr.md`.
6. Fill the frontmatter:
   - `id: ADR-NNNN`
   - `title:` — title-case of `$ARGUMENTS`
   - `status: Proposed`
   - `date:` — today's date
   - `deciders:` — current git user
7. Add a row to `docs/adr/README.md` under the Index section.
8. Continue with `adr-author` to guide Context / Decision / Consequences
   / Alternatives.
