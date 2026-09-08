# Data layer — what the server actually serves

The panel was written against the V1 Supabase backend. The API it talks to now
is `@dns/admin-api`, and only part of that surface exists yet. This table is
the honest state, so nobody assumes a screen works because its client compiles.

| Domain | Server | Notes |
| --- | --- | --- |
| `auth` | ✅ | `/auth/login`, `/refresh`, `/logout`, `/me` |
| `recipe` | ✅ | CRUD, CSV import, presigned photo upload |
| `tag` | ✅ read-only | `GET /tags` — the flat façade over categories, cuisines and diets. There is no write side and, under ADR-0006, none is planned. |
| `product` | ✅ | CRUD, CSV import, verification, archiving. The recipe form's ingredient picker reads the same `GET /products` — a second, simpler list would disagree about which rows exist. |
| `user` | ✅ | Directory, card, blocking, cancelling a deletion request. There is deliberately no «delete account» call — ADR-0005 is still open. |
| `support` | ✅ | The queue, its states and internal notes, over `/feedback`. Nothing is sent to the reporter from here — replies go out by email. |
| `notifications` | ❌ | No endpoints. Screens will 404. |
| `language` | ❌ | " |
| `dashboard` | ❌ | " |

The three without a server are left in their V1 shape on purpose: rewriting a
client against an endpoint nobody has designed yet produces a contract that
drifts before it is ever called. They keep their `/admin/...` paths, which is
also a useful marker — anything still carrying that prefix has no backend.

## Conventions the working domains follow

- **No `/admin` prefix.** The admin API has its own subdomain and port; a path
  segment would repeat what the hostname already says (ADR-0002).
- **camelCase, `{ data }` envelope**, `{ data, meta }` when paginated
  (ADR-0004). `HttpService.get` unwraps to `data`; `getPaginated` keeps `meta`.
- **`NEXT_PUBLIC_API_URL` includes the version prefix** —
  `https://dev.api.admin.rationfit.com/api/v1`. The service adds nothing.
- **Grams only** in a recipe's composition. There is no `unit`: a dish whose
  totals must add up cannot contain «1 cup».
- **Photos bypass the API.** The server signs a URL, the browser PUTs to
  storage. Only the CSV import posts a file to us.
