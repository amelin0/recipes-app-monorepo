# Client bucket

Consumer-facing surfaces: the Expo mobile app ([`apps/mobile/`](../../../apps/mobile))
and the client API ([`apps/api/src/client/`](../../../apps/api/src/client)).
Users with the **USER** role.

## Domains

| Domain | Scope |
|---|---|
| [`auth/`](./auth) | Registration, login, sessions |
| [`user/`](./user) | Profile, settings, weight tracking |
| [`nutrition/`](./nutrition) | Nutrition goals, daily macro tracking |
| [`recipe/`](./recipe) | Recipe browsing, filters, tags, i18n |
| [`product/`](./product) | USDA + custom products, search by language |
| [`shopping-list/`](./shopping-list) | Shopping list, ingredient aggregation |
| [`meal-plan/`](./meal-plan) | Weekly meal planning |

Each domain folder has a `README.md` index and one folder per feature
(`<feature>/spec.md` + `<feature>/plan.md`).
