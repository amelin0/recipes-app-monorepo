---
spec: ./spec.md
status: Implemented
owner: '@amelin0'
created: 2026-09-06
updated: 2026-09-11
related-adrs: [ADR-0004]
related-runbooks: []
---

# Plan: Profile (Профіль)

## Summary

Екран читається одним запитом `GET /profile`. FR-001 (імʼя, email, ініціали)
і FR-005 (значення налаштувань у підрядках) покриває `ProfileService`
поверх таблиць `profiles` і `user_settings`. FR-003 (рядок «Підписка») —
вкладений `subscription`, прочитаний тим самим викликом репозиторію, що й
`GET /subscription`. FR-002, FR-006, FR-007, FR-010,
FR-011 — статична розкладка, версія збірки і мітки для скрінрідера — цілком
клієнтські. FR-004 («Оцініть нас») — системний діалог, серверу невидимий.

FR-008 («Вийти») використовує `POST /auth/logout` із
[`../../auth/session/plan.md`](../../auth/session/plan.md).

FR-009 **застаріла**: вона описує безповоротне видалення, а пізніша специфікація
[`../account-deletion/spec.md`](../account-deletion/spec.md) (оновлена
2026-08-20 проти 2026-08-19) замінює його 30-денним пільговим періодом.
Реалізовано пізнішу.

## Database

### Table `profiles`

| Column                      | Type          | Constraints                                          |
| --------------------------- | ------------- | ---------------------------------------------------- |
| `user_id`                   | `uuid`        | PK **і** FK → `users.id` ON DELETE CASCADE           |
| `name`                      | `text`        | NULL, поки анкета або екран редагування не заповнять |
| `photo_url`                 | `text`        | NULL                                                 |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL, `now()`                                    |

**Чому окрема таблиця, а не ширші `users`.** `JwtStrategy` читає `users` на
кожен авторизований запит, і цей рядок має лишатися вузьким. Плюс флоу
видалення має стерти персональні дані, поки рядок ідентичності доживає свій
пільговий період — межу простіше витримати, коли вона ще й межа таблиці.

`user_id` як первинний ключ, а не окремий `id`: рівно один профіль на акаунт,
без можливості завести другий чи осиротілий.

Анкета онбордингу вже додала сюди стать, дату народження, вагу, зріст,
рівень активності, мету й цільову вагу — див.
[`../../onboarding/profile-setup/plan.md`](../../onboarding/profile-setup/plan.md).
Ці колонки наразі **не** потрапляють у `GET /profile`: екран профілю їх не
показує, а анкета читає через `GET /profile/onboarding`.

### Migrations

- `0001_mighty_corsair.sql` — `profiles`, `user_settings`, `user_reminders`,
  `account_deletion_requests`.

## API contract

### `GET /profile`

**Auth:** `JwtGuard` (Bearer)

**Response 200:**

```json
{
    "data": {
        "id": "<uuid>",
        "email": "user@example.com",
        "name": "Олег Чередник",
        "photoUrl": null,
        "initials": "ОЧ",
        "settings": {
            "language": "uk",
            "theme": "system",
            "massUnit": "METRIC",
            "productWeightUnit": "METRIC",
            "lengthUnit": "METRIC",
            "waterUnit": "METRIC"
        },
        "subscription": {
            "planSlug": "monthly",
            "planName": "Місячний план",
            "period": "month",
            "expiresAt": "2026-10-11T09:00:00.000Z",
            "daysRemaining": 30,
            "…": "…"
        }
    }
}
```

**Errors:** `401` — немає/прострочений токен.

**`subscription` — рівно той об'єкт, що `GET /subscription` віддає в полі
`subscription`** (`SubscriptionView`), прочитаний тим самим
`SubscriptionRepository.findActive`. Так SC-005 («стан у профілі збігається з
екраном підписки») виконується конструктивно: вужча форма того самого рядка
була б другим місцем, де дата могла б розійтися. Тег — `planName` мовою
акаунта, «До …» — `expiresAt`; формат дати лишається клієнту (відкрите
питання специфікації).

`null` — безкоштовний рівень **і** підписка, строк якої минув, навіть якщо
рядок ще позначений `active`: фільтр `expires_at > now()` той самий, що на
екрані підписки. Як підписано рядок без підписки — відкрите питання, і текст
пише клієнт.

Читання окреме від `getAggregate`: той самий агрегат читає онбординг, якому
підписка ні до чого, — тож `ProfileService.getScreen` додає один запит лише
для екрана профілю. Мова для назви плану береться з уже прочитаного рядка
налаштувань, окремого звернення за нею немає.

`PATCH /profile` віддає те саме тіло, включно з підпискою: відповідь на запис
і читання мають бути однаковою формою.

**Налаштування вкладені, а не окремим запитом.** Рядки «Мова», «Тема»,
«Одиниці виміру» показують поточне значення підрядком (FR-005), тож екран усе
одно їх потребує; другий раунд-тріп заради шести полів — гірший розмін, ніж
трохи більший payload. Окремого `GET /profile/settings` навмисно **немає**:
два шляхи читання тих самих даних розходяться першими.

**Ініціали рахує сервер**, а не клієнт: аватар зʼявляється в кількох місцях, і
одне визначення «перші літери до двох слів» гарантує, що всі вони пишуть
однаково.

## Environment variables

Власних не додає.

## File structure

```
apps/client-api/src/modules/user/profile.controller.ts
apps/client-api/src/modules/user/profile.service.ts          # getAggregate, getScreen
apps/client-api/src/modules/user/dto/outbound/{profile,user-settings}.view.ts
apps/client-api/src/modules/subscription/dto/outbound/subscription.view.ts  # SubscriptionView, спільний
packages/database/src/schema/profiles.schema.ts
packages/database/src/entities/profile.entity.ts        # initials()
packages/database/src/repositories/profile/
```

## Shared contract

Власних типів не додає; `UserSettingsView` описано в
[`../app-settings/plan.md`](../app-settings/plan.md).

## Security & edge cases

- `profiles` і `user_settings` пишуться в одній транзакції з акаунтом, тож
  відсутність будь-якого з рядків — зламаний інваріант, а не стан. Сервіс
  кидає 500 із текстом, який називає акаунт: тихий `null`, що доїде до
  клієнта, гірший за помітну помилку.
- Профіль завжди читається за `user.id` із токена; параметра, яким можна
  було б попросити чужий профіль, у контракті немає.

## Rollout

- Feature flag: немає.
- Порядок: БД-міграція → деплой `client-api` → реліз застосунку.

## Verification

- `apps/client-api/test/user-profile.db-spec.ts` — блоки `provisioning`
  (новий акаунт отримує профіль і налаштування), `profile and settings` і
  `subscription row`: `null` на безкоштовному рівні, об'єкт, що дорівнює
  `GET /subscription` (SC-005), і `null` для підписки з минулим строком.
- Смоук: `GET /profile` одразу після реєстрації має віддати `name: null`,
  `initials: ""`, повний набір налаштувань за замовчуванням і
  `subscription: null`.

## Що ще не побудовано

- **Куди веде рядок «Підписка»** (FR-003, US-2 сценарій 3) — екран керування
  підпискою не задизайнений і в специфікації paywall прямо поза межами.
  Сервер віддає все, що цей рядок показує; переходу вести нікуди.

## Related

- Spec: [./spec.md](./spec.md)
- ADRs: [ADR-0004](../../../../adr/0004-client-api-url-conventions.md)
