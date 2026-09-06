---
spec: ./spec.md
status: Approved
owner: '@amelin0'
created: 2026-09-06
updated: 2026-09-06
related-adrs: [ADR-0004]
related-runbooks: []
---

# Plan: Profile (Профіль)

> **Status is `Approved`, not `Implemented`:** FR-003 (стан підписки) чекає на
> домен subscription. Решта серверної частини на місці — див. «Що ще не
> побудовано».

## Summary

Екран читається одним запитом `GET /profile`. FR-001 (імʼя, email, ініціали)
і FR-005 (значення налаштувань у підрядках) покриває `ProfileService`
поверх таблиць `profiles` і `user_settings`. FR-002, FR-006, FR-007, FR-010,
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

Анкета онбордингу додасть сюди стать, дату народження, зріст, рівень
активності й цілі — своїм зрізом.

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
        }
    }
}
```

**Errors:** `401` — немає/прострочений токен.

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
apps/client-api/src/modules/user/profile.service.ts
apps/client-api/src/modules/user/dto/outbound/{profile,user-settings}.view.ts
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

- `apps/client-api/test/user-profile.db-spec.ts` — блок `provisioning`
  (новий акаунт отримує профіль і налаштування) і `profile and settings`.
- Смоук: `GET /profile` одразу після реєстрації має віддати `name: null`,
  `initials: ""` і повний набір налаштувань за замовчуванням.

## Що ще не побудовано

- **FR-003, стан підписки** — домен subscription не існує. Поле свідомо
  відсутнє у відповіді, а не повертається як `null`: додати його потім
  сумісно зі зворотним боком, а вигадати зараз означало б віддавати значення,
  яке нічим наповнити.
- Фото профілю — див. [`../profile-edit/plan.md`](../profile-edit/plan.md).

## Related

- Spec: [./spec.md](./spec.md)
- ADRs: [ADR-0004](../../../../adr/0004-client-api-url-conventions.md)
