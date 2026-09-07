---
spec: ./spec.md
status: Implemented
owner: '@amelin0'
created: 2026-09-06
updated: 2026-09-06
related-adrs: [ADR-0003]
related-runbooks: []
---

# Plan: Password reset (Відновлення паролю)

## Summary

FR-001…FR-007 лягають на `PasswordResetService` у
`apps/client-api/src/modules/auth/`, таблицю `password_reset_permits` і
спільну з реєстрацією `otp_codes` (`purpose = 'password_reset'`). FR-008
(маскування адреси), FR-009 і FR-010 (екран «Пароль змінено» як кінцева точка)
— клієнтські; бекендна частина FR-009 полягає в тому, що сесія після зміни
пароля **не видається**.

Цей же флоу задає пароль уперше для акаунту, створеного через Apple або Google
(sign-up FR-013).

## Database

### Table `password_reset_permits`

| Column        | Type          | Constraints                                 |
| ------------- | ------------- | ------------------------------------------- |
| `id`          | `uuid`        | PK; їде в permit-токені як `jti`            |
| `user_id`     | `uuid`        | NOT NULL, FK → `users.id` ON DELETE CASCADE |
| `expires_at`  | `timestamptz` | NOT NULL                                    |
| `consumed_at` | `timestamptz` | NULL                                        |
| `created_at`  | `timestamptz` | NOT NULL, `now()`                           |

Indexes:

- `password_reset_permits_user_id_idx` on `(user_id)`

**Чому взагалі рядок, а не самодостатній JWT.** Самодостатній токен можна
пред'являти скільки завгодно разів до кінця строку дії, а FR-010 вимагає, щоб
флоу став тупиком після використання. Рядок — це і є те, що робить дозвіл
одноразовим.

Коди відновлення живуть у `otp_codes` із `purpose = 'password_reset'` — та сама
таблиця і та сама механіка, що для підтвердження email (див.
[`../sign-up/plan.md`](../sign-up/plan.md)).

## API contract

### `POST /auth/password-reset/request`

**Auth:** none (`@Public`), throttle-ключ `password-reset`

**Request body:** `{ "email": "user@example.com" }`

**Response 204** — завжди, незалежно від існування акаунту (FR-001).

**Errors:** `422` — не email; `429` — ліміт.

Свідомо не перевіряємо, чи має акаунт пароль: для створеного через провайдера
це шлях задати пароль уперше.

### `POST /auth/password-reset/verify`

**Auth:** none (`@Public`), throttle-ключ `verify-otp`

**Request body:** `{ "email": "user@example.com", "code": "123456" }`

**Response 200:**

```json
{ "data": { "permitToken": "<jwt>" } }
```

**Errors:**

- `400` `auth.invalid-code` — включно з адресою без акаунту: крок запиту
  відмовився підтверджувати існування акаунту, і цей крок не має цього
  скасовувати.
- `429`.

### `POST /auth/password-reset/complete`

**Auth:** none (`@Public`), throttle-ключ `password-reset`

**Request body:**

```json
{ "permitToken": "<jwt>", "password": "newpassw0rd", "passwordConfirmation": "newpassw0rd" }
```

| Field                  | Type   | Required | Validation                                   |
| ---------------------- | ------ | -------- | -------------------------------------------- |
| `password`             | string | yes      | та сама політика, що при реєстрації (FR-004) |
| `passwordConfirmation` | string | yes      | має збігатися з `password`                   |

**Response 204** — сесія НЕ видається (FR-009): FR-005 щойно відкликав усі
сесії акаунту, тож видати нову означало б суперечити самому собі.

**Errors:**

- `401` `auth.invalid-permit` — невідомий, прострочений або вже спожитий дозвіл.
- `422` — валідація, зокрема розбіжність із полем підтвердження
  (`path: "passwordConfirmation"`).
- `429`.

## Environment variables

Окремих не додає. Використовує `JWT_REFRESH_SECRET` (підпис permit-токена),
`RESEND_API_KEY` / `EMAIL_FROM`, `OTP_DEV_CODE` і
`THROTTLE_PASSWORD_RESET_TTL` / `_LIMIT` (default `3600000` / `5`).

## File structure

```
apps/client-api/src/modules/auth/password-reset.service.ts
apps/client-api/src/modules/auth/dto/inbound/{request-password-reset,verify-password-reset-code,set-new-password}.inbound.dto.ts
apps/client-api/src/modules/auth/dto/outbound/password-reset-permit.view.ts
packages/database/src/schema/password-reset-permits.schema.ts
packages/database/src/repositories/password-reset-permit/
```

## Shared contract

- `@dns/validation` — `requestPasswordResetSchema`,
  `verifyPasswordResetCodeSchema`, `setNewPasswordSchema` (остання несе правило
  збігу з полем підтвердження, тож форма в застосунку і сервер перевіряють
  однакове).
- `@dns/constants` — `AUTH_POLICY.passwordResetPermit.ttlMinutes`.

## Security & edge cases

- **Permit-токен підписано `JWT_REFRESH_SECRET`, а не ключем access-токенів.**
  Первинний захист — claim `type: 'password-reset'`, який перевіряють і
  `JwtStrategy`, і ротація refresh; різний ключ означає, що помилки в одній
  перевірці самої по собі недостатньо, щоб дозвіл почав відкривати сесію. Без
  цього той, хто знає код відновлення, отримував би сесію — рівно те, що
  FR-009 забороняє.
- **Порядок у `setNewPassword`**: позначити дозвіл спожитим → змінити пароль →
  відкликати сесії → видалити дозволи → видалити коди. Відкликання після зміни
  пароля не лишає вікна, у якому стара сесія переживає новий пароль.
- Відповідь на крок запиту однакова для існуючої і неіснуючої адреси, і на
  кроці перевірки коду це не скасовується — інакше двокроковий флоу став би
  перевіркою адрес попри FR-001.

## Rollout

- Feature flag: немає.
- Порядок: БД-міграція → деплой `client-api` → реліз мобільного застосунку.
- Зворотна сумісність: не потрібна, перший реліз API.

## Verification

- `apps/client-api/test/auth-otp.db-spec.ts` — завершене відновлення вбиває всі
  сесії й обидва артефакти, а запит на неіснуючу адресу мовчазний і нічого не
  пише в базу.
- Смоук після деплою: пройти флоу до кінця, потім повторити `complete` з тим
  самим `permitToken` — має бути 401 `auth.invalid-permit`, а пароль лишитися
  тим, що задали першим викликом.
- Перевірити, що `permitToken` не приймається ні на `GET /auth/me`, ні на
  `POST /auth/refresh`.

## Related

- Spec: [./spec.md](./spec.md)
- Plan (коди): [../sign-up/plan.md](../sign-up/plan.md)
- Plan (відкликання сесій): [../session/plan.md](../session/plan.md)
- ADRs: [ADR-0003](../../../../adr/0003-auth-model-tokens-and-admin-permissions.md)
