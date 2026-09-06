---
spec: ./spec.md
status: Implemented
owner: '@amelin0'
created: 2026-09-06
updated: 2026-09-06
related-adrs: [ADR-0004]
related-runbooks: []
---

# Plan: App settings (Налаштування застосунку)

## Summary

FR-002, FR-005 і FR-007 — серверна частина: одна таблиця `user_settings` і
один `PATCH /profile/settings`. FR-001 (список мов власними назвами), FR-003 і
FR-004 (зразок оформлення, реакція «Системної» теми на налаштування пристрою)
— клієнтські. FR-006 (застосування одиниць скрізь) теж клієнтський: сервер
віддає значення у своїх канонічних одиницях, застосунок конвертує для показу.

## Database

### Table `user_settings`

| Column                      | Type          | Constraints                                |
| --------------------------- | ------------- | ------------------------------------------ |
| `user_id`                   | `uuid`        | PK **і** FK → `users.id` ON DELETE CASCADE |
| `language`                  | `text`        | NOT NULL                                   |
| `theme`                     | `theme`       | NOT NULL — `light` \| `dark` \| `system`   |
| `mass_unit`                 | `text`        | NOT NULL — маса тіла                       |
| `product_weight_unit`       | `text`        | NOT NULL — вага продуктів                  |
| `length_unit`               | `text`        | NOT NULL — зріст і обміри                  |
| `water_unit`                | `text`        | NOT NULL — вода                            |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL, `now()`                          |

**Чотири окремі колонки одиниць, а не один перемикач системи.** FR-005 дає
обирати незалежно, і випадок, який до цього змушує, — людина, що думає вагою
тіла в кілограмах, а куркою у фунтах.

**`language` як `text`, а не enum.** Набір підтримуваних мов змінюється разом
із контентом, а не з міграцією; чинний список тримає `SUPPORTED_LANGUAGES` у
`@dns/constants`, і схема запиту його ж і перевіряє. `theme` — навпаки enum:
три значення задає дизайн, і четверте означало б новий екран.

Рядок пишеться в тій самій транзакції, що й акаунт, тож кожне читання
знаходить дефолти вже на місці — синтезувати їх у коді не доводиться.

## API contract

### `PATCH /profile/settings`

**Auth:** `JwtGuard` (Bearer)

**Request body** — усі поля необовʼязкові; клієнт шле лише перемкнуте:

```json
{ "theme": "dark" }
```

| Field                                                      | Type   | Validation                       |
| ---------------------------------------------------------- | ------ | -------------------------------- |
| `language`                                                 | string | має бути в `SUPPORTED_LANGUAGES` |
| `theme`                                                    | enum   | `light` \| `dark` \| `system`    |
| `massUnit`, `productWeightUnit`, `lengthUnit`, `waterUnit` | enum   | `METRIC` \| `IMPERIAL`           |

**Response 200:** повний набір налаштувань після зміни.

**Errors:**

- `422` — невідома мова, невідоме значення enum, **або порожнє тіло**: запит,
  що нічого не змінює, це помилка клієнта, а не успішний no-op.
- `401`.

**Один `PATCH` замість ендпоінта на поле** (ADR-0004, правило 4). Шість
перемикачів — це шість полів однієї схеми; сьоме налаштування має стати полем,
а не сьомим маршрутом.

Читання окремого маршруту не має: налаштування приходять вкладеними в
`GET /profile` (див. [`../profile/plan.md`](../profile/plan.md)).

## Environment variables

Власних не додає.

## File structure

```
apps/client-api/src/modules/user/profile.controller.ts     # PATCH /profile/settings
apps/client-api/src/modules/user/profile.service.ts
apps/client-api/src/modules/user/dto/outbound/user-settings.view.ts
packages/database/src/schema/user-settings.schema.ts
packages/database/src/entities/user-settings.entity.ts
packages/database/src/repositories/user-settings/
packages/validation/src/user.schemas.ts                    # updateSettingsSchema
packages/constants/src/user-defaults.ts                    # USER_SETTINGS_DEFAULTS
```

## Shared contract

- `@dns/shared-types` — `Theme`; одиниці переюзають наявний `MetricSystem`.
- `@dns/validation` — `updateSettingsSchema`.
- `@dns/constants` — `USER_SETTINGS_DEFAULTS`, `SUPPORTED_LANGUAGES`.

## Security & edge cases

- Часткове тіло не може випадково обнулити сусіднє поле: репозиторій пише
  тільки передані ключі.
- Мова перевіряється проти списку, а не приймається як довільний рядок —
  інакше в колонці зʼявляться значення, для яких немає перекладів.
- Налаштування читаються і пишуться лише для власника токена.

## Rollout

- Feature flag: немає.
- Порядок: БД-міграція → деплой `client-api` → реліз застосунку.

## Verification

- `packages/validation/src/user.schemas.test.ts` — часткове тіло, порожнє
  тіло, непідтримувана мова.
- `apps/client-api/test/user-profile.db-spec.ts` — зміна однієї теми не чіпає
  решту полів.
- Смоук: `PATCH /profile/settings` із `{"theme":"dark"}` має повернути повний
  набір, де змінилася лише тема.

## Related

- Spec: [./spec.md](./spec.md)
- Plan (де налаштування читаються): [../profile/plan.md](../profile/plan.md)
- ADRs: [ADR-0004](../../../../adr/0004-client-api-url-conventions.md)
