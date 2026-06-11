---
description: Scaffold a new feature spec folder with spec.md inside
argument-hint: <bucket>/<domain>/<feature>
---

Create a new feature folder at `docs/specs/$ARGUMENTS/` containing
`spec.md`. Every feature lives in its own folder; flat files are not
allowed for new work.

Steps:

1. Validate the argument: `<bucket>` MUST be one of `client`, `admin`.
   Refuse if not.
2. Parse `$ARGUMENTS` into `<bucket>/<domain>/<feature>`.
3. If the domain folder `docs/specs/<bucket>/<domain>/` does not exist:
   - Create it.
   - Copy `docs/templates/domain-readme.md` to
     `docs/specs/<bucket>/<domain>/README.md`.
   - Replace `<Domain>` placeholder with the domain name.
4. If `docs/specs/<bucket>/<domain>/<feature>/` already exists, refuse
   and tell the user to edit `spec.md` inside it.
5. Create the feature folder `docs/specs/$ARGUMENTS/`.
6. Copy `docs/templates/spec.md` to `docs/specs/$ARGUMENTS/spec.md`.
7. Fill the frontmatter:
   - `title:` — title-case of the feature name
   - `bucket:` — the bucket from the argument
   - `domain:` — the domain from the argument
   - `status: Draft`
   - `owner:` — current git user (`git config user.email`)
   - `created:` — today's date (YYYY-MM-DD)
   - `updated:` — today's date
   - `plan: ./plan.md`
8. Add a row for this feature to
   `docs/specs/<bucket>/<domain>/README.md` under the Specs table.
   Link target: `<feature>/spec.md`. Status `Draft`, today's date.
9. Trigger the `spec-author` skill — guide the user through writing the
   spec section by section, technology-agnostic.
10. Once the spec is in good shape, suggest running
    `/new-plan docs/specs/$ARGUMENTS/spec.md` to create the technical
    plan in the same folder.
