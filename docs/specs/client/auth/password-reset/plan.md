---
spec: ./spec.md
status: Implemented
owner: '@amelin0'
created: 2026-09-06
updated: 2026-09-12
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
  скасовувати. Так само — другий із двох паралельних запитів з одним
  правильним кодом.
- `429`.

Дозвіл створюється **в тій самій транзакції, що витрачає код**
(`PasswordResetPermitRepository.createFromCode`): умовне споживання коду →
вставка дозволу. Один код — рівно один дозвіл, скільки б запитів із ним не
прийшло одночасно. Спроби рахуються так само, як у реєстрації (резерв спроби
до порівняння — див. sign-up plan).

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
сесії акаунту, тож видати нову означало б суперечити самому собі. «Усі сесії»
включає **вже видані токени доступу**: та сама транзакція ставить
`users.sessions_valid_from`, і `JwtStrategy` відмовляє токену, старшому за цю
мітку. Без неї токен, узятий до зміни пароля, працював би ще 15 хвилин — і
писав: QA міняла ним імʼя профілю вже після `204` тут.

**Errors:**

- `401` `auth.invalid-permit` — невідомий, прострочений або вже спожитий дозвіл,
  зокрема другий із двох паралельних запитів з одним `permitToken`.
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
- **`setNewPassword` — одна транзакція `UserRepository.resetPasswordWithPermit`**:
  `SELECT … FROM users WHERE id = $sub FOR NO KEY UPDATE` → `UPDATE
password_reset_permits SET consumed_at = now() WHERE id = $jti AND user_id =
$sub AND consumed_at IS NULL AND expires_at > now()` (нуль рядків ⇒ 401) →
  новий `password_hash` **разом із `sessions_valid_from = clock_timestamp()`**
  → видалити всі refresh-токени, усі дозволи і **всі** коди акаунту (обох
  флоу). Раніше дозвіл читали, перевіряли в сервісі й позначали окремим
  запитом — два запити з одним дозволом обидва міняли пароль.
- **Мітка в тому самому `UPDATE`, що й хеш пароля.** Видалити токен доступу
  не можна — він не зберігається на сервері, — тож FR-005 виконується лише
  тим, що `JwtStrategy` звіряє `iat` з міткою (див.
  [session plan](../session/plan.md), «Column `users.sessions_valid_from`»,
  там же — чому `clock_timestamp()` і чому секундна роздільність `iat`
  трактується проти токена).
- **Рядок користувача блокується першим.** Це те саме блокування відкликання,
  що в `logout-all` (див. session plan): подовження в польоті або встигає
  раніше — і його нащадка видаляє `DELETE` цієї транзакції, — або чекає і не
  знаходить свого токена. Порядок «користувач → дозвіл → токени» такий самий,
  як у ротації; споживання дозволу до блокування користувача давало б
  взаємоблокування двох скидань одного акаунту різними дозволами.
- bcrypt нового пароля рахується **до** транзакції, щоб не тримати
  блокування рядка на час хешування. Вхід старим паролем, що перетнувся зі
  скиданням, не переживає його: сесія зберігається під тим самим блокуванням
  із перевіркою, що хеш пароля не змінився.
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
- `apps/client-api/test/auth-password-reset-races.db-spec.ts` — один код
  паралельно купує рівно один дозвіл; один дозвіл паралельно міняє пароль
  рівно раз (і саме на пароль переможця); два живі дозволи одночасно — один
  перемагає, другий 401, без взаємоблокування.
- `apps/client-api/test/auth-refresh-races.db-spec.ts` — скидання проти
  ротації в польоті і проти входу старим паролем не лишає жодної сесії.
- `apps/client-api/test/auth-session-revocation.db-spec.ts` — завершене
  скидання вбиває токен доступу, узятий до нього, і на читанні, і на записі
  (`PATCH /profile`), на всіх пристроях; вхід з новим паролем одразу після
  цього працює.
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
