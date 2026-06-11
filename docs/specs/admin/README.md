# Admin bucket

Internal staff surfaces: the Next.js admin panel ([`apps/web/`](../../../apps/web))
and the admin API ([`apps/api/src/admin/`](../../../apps/api/src/admin)).
Users with **ADMIN** / **SUPER_ADMIN** roles — separate auth model from client.

## Domains

| Domain | Scope |
|---|---|
| [`auth/`](./auth) | Admin login, role checks |
| [`users/`](./users) | User directory and management |
| [`recipe/`](./recipe) | Recipe CRUD, tags, ingredient editing, translations |
| [`product/`](./product) | Product CRUD, translation editing |

Each domain folder has a `README.md` index and one folder per feature
(`<feature>/spec.md` + `<feature>/plan.md`).
