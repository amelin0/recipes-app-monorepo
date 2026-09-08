# Admin bucket

Internal staff surfaces: the Next.js admin panel ([`apps/web/`](../../../apps/web))
and the admin API ([`apps/admin-api/src/`](../../../apps/admin-api/src)).
Staff accounts live in their own `admins` table with **ADMIN** / **SUPER_ADMIN**
roles — a separate auth model and a separate service from the client
(see [ADR-0002](../../adr/0002-split-client-and-admin-api.md),
[ADR-0003](../../adr/0003-auth-model-tokens-and-admin-permissions.md)).

## Domains

| Domain | Scope |
|---|---|
| [`auth/`](./auth) | Admin login, role checks |
| [`users/`](./users) | User directory and management |
| [`recipe/`](./recipe) | Recipe CRUD, tags, ingredient editing, translations |
| [`product/`](./product) | Product CRUD, translation editing |
| [`support/`](./support) | Звернення з застосунку: черга, стан, нотатки |
| [`dashboard/`](./dashboard) | Головна панелі: ріст, розмір каталогу, черги |

Each domain folder has a `README.md` index and one folder per feature
(`<feature>/spec.md` + `<feature>/plan.md`).
