---
spec: ./spec.md
status: Implemented
owner: '@amelin0'
created: 2026-09-06
updated: 2026-09-06
related-adrs: [ADR-0003]
related-runbooks: []
---

# Plan: Sign-up (Реєстрація)

## Summary

FR-001…FR-007, FR-009 і FR-014 лягають на `AuthService.register` /
`verifyEmail` / `resendEmailCode` у `apps/client-api/src/modules/auth/` та
таблиці `users` і `otp_codes`. FR-011…FR-013 (реєстрація через провайдера)
описані в [`../sign-in/plan.md`](../sign-in/plan.md) — вхід і реєстрація через
Apple/Google це один механізм. FR-008 (маскування адреси) і FR-010 (згода з
умовами) — клієнтські, бекенду не стосуються.

Політика пароля, TTL коду і ліміт спроб — рішення ADR-0003.

## Database

### Table `users`

| Column                      | Type          | Constraints                                     |
| --------------------------- | ------------- | ----------------------------------------------- |
| `id`                        | `uuid`        | PK, `gen_random_uuid()`                         |
| `email`                     | `text`        | NOT NULL, UNIQUE (`users_email_unique`)         |
| `password_hash`             | `text`        | NULL — акаунт через провайдера ще не має пароля |
| `email_verified_at`         | `timestamptz` | NULL, поки код не підтверджено                  |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL, `now()`                               |

**Регістронезалежність (FR-001)** досягається нормалізацією на запису:
`emailSchema` у `@dns/validation` робить `trim().toLowerCase()`, тож у базу
потрапляє тільки нижній регістр і звичайного унікального індексу достатньо.
Регістр, який ввів користувач, не зберігається — жоден екран не показує
адресу назад із його капіталізацією.

**Чому `email_verified_at`, а не булеве поле** — дата відповідає на «коли»,
що знадобиться і підтримці, і майбутнім метрикам воронки; булеве поле цю
інформацію втрачає без жодної вигоди.

### Table `otp_codes`

| Column        | Type          | Constraints                                         |
| ------------- | ------------- | --------------------------------------------------- |
| `id`          | `uuid`        | PK                                                  |
| `user_id`     | `uuid`        | NOT NULL, FK → `users.id` ON DELETE CASCADE         |
| `purpose`     | `otp_purpose` | NOT NULL — `email_verification` \| `password_reset` |
| `code_hash`   | `text`        | NOT NULL, bcrypt                                    |
| `attempts`    | `integer`     | NOT NULL, default 0                                 |
| `expires_at`  | `timestamptz` | NOT NULL                                            |
| `consumed_at` | `timestamptz` | NULL                                                |
| `created_at`  | `timestamptz` | NOT NULL, `now()`                                   |

Indexes:

- `otp_codes_user_id_purpose_idx` on `(user_id, purpose)` — пошук чинного коду.

**Одна таблиця на два флоу.** Код підтвердження і код відновлення мають
однакову механіку (6 цифр, строк дії, одноразовість, лічильник спроб) і
різняться лише тим, що дає їх споживання — це `purpose`, а не окрема таблиця.

**bcrypt, а не швидкий дайджест.** Простір 6-значного коду — 10⁶; таблиця
SHA-256 хешів реверситься миттєво.

**`attempts` інкрементується в SQL** (`attempts + 1`), а не read-modify-write:
два коди, надіслані одночасно, мають обидва порахуватися, інакше ліміт спроб
обходиться гонкою.

## API contract

### `POST /auth/register`

**Auth:** none (`@Public`), throttle-ключ `register`

**Request body:**

```json
{ "email": "user@example.com", "password": "passw0rd" }
```

| Field      | Type   | Required | Validation                                        |
| ---------- | ------ | -------- | ------------------------------------------------- |
| `email`    | string | yes      | email, нормалізується до нижнього регістру        |
| `password` | string | yes      | ≥ 8 символів, ≤ 72 байтів, ≥ 1 літера і ≥ 1 цифра |

**Response 201** — тіла немає; код надіслано на пошту. Сесія НЕ видається
(FR-003).

**Errors:**

- `409` `auth.email-taken` — акаунт із підтвердженим email уже існує.
- `422` — валідація; `errors[]` називає конкретне невиконане правило, бо поля
  підтвердження пароля у формі немає (FR-002).
- `429` — перевищено ліміт.

**Повторна реєстрація на непідтверджений акаунт не є помилкою.** Пароль
замінюється, код перевидається, відповідь 201. Це єдиний вихід для того, хто
помилився в паролі з першого разу; атакуючому це нічого не дає, бо код усе
одно йде на ту саму поштову скриньку.

**Ця відповідь свідомо розкриває існування акаунту** (FR-009 просить дати
користувачеві змогу перейти до входу). На `/auth/login` і на відновленні
паролю розкриття, навпаки, заборонене — там воно нічого не дає користувачеві.

### `POST /auth/verify-email`

**Auth:** none (`@Public`), throttle-ключ `verify-otp`

**Request body:** `{ "email": "user@example.com", "code": "123456" }`

| Field  | Type   | Required | Validation   |
| ------ | ------ | -------- | ------------ |
| `code` | string | yes      | рівно 6 цифр |

**Response 200:** `{ "data": { "accessToken": "...", "refreshToken": "..." } }`
— користувач автентифікований одразу (FR-007).

**Errors:**

- `400` `auth.invalid-code` — невірний, прострочений, спожитий код, вичерпані
  спроби або адреса без акаунту. Усі п'ять випадків нерозрізненні навмисно.
- `429`.

**Власний throttle-ключ** — вимога FR-014: екран запускає перевірку автоматично
на шостій цифрі, тож ендпоінт викликається частіше, ніж якби була кнопка.

### `POST /auth/resend-code`

**Auth:** none (`@Public`), throttle-ключ `send-otp`

**Request body:** `{ "email": "user@example.com" }`

**Response 204** — завжди. Неіснуючий і вже підтверджений акаунт просто не
мають чого надсилати, і сказати про це означало б зробити з ендпоінта
перевірку адрес.

Кулдаун 30 с (FR-006) показує клієнт; сервером його не дублюємо — реальний
захист дає rate limit, а таймер це елемент UX.

## Environment variables

| Variable                             | Description                                         | Required | Default                 |
| ------------------------------------ | --------------------------------------------------- | -------- | ----------------------- |
| `RESEND_API_KEY`                     | ключ Resend; порожній → stub-клієнт пише лист у лог | no       | —                       |
| `EMAIL_FROM`                         | адреса відправника                                  | no       | `noreply@rationfit.app` |
| `OTP_DEV_CODE`                       | фіксований код для локальної розробки               | no       | —                       |
| `THROTTLE_REGISTER_TTL` / `_LIMIT`   | вікно і ліміт реєстрації                            | no       | `3600000` / `5`         |
| `THROTTLE_SEND_OTP_TTL` / `_LIMIT`   | вікно і ліміт надсилання кодів                      | no       | `3600000` / `5`         |
| `THROTTLE_VERIFY_OTP_TTL` / `_LIMIT` | вікно і ліміт перевірки кодів                       | no       | `900000` / `10`         |

## File structure

```
apps/client-api/src/modules/auth/auth.service.ts          # register, verifyEmail, resendEmailCode
apps/client-api/src/modules/auth/otp.service.ts           # видача і споживання кодів
apps/client-api/src/modules/auth/otp.mailer.ts            # тексти листів
apps/client-api/src/modules/auth/auth.errors.ts           # коди помилок
apps/client-api/src/modules/auth/dto/inbound/
packages/database/src/schema/{users,otp-codes}.schema.ts
packages/database/src/repositories/{user,otp-code}/
packages/api-infrastructure/src/{email,otp}/
```

## Shared contract

- `@dns/shared-types` — `OtpPurpose`.
- `@dns/validation` — `emailSchema`, `passwordSchema`, `otpCodeSchema`,
  `registerSchema`, `verifyEmailSchema`, `resendEmailCodeSchema`. Мобільний
  застосунок переюзає ті самі схеми у формах, тож правила не розходяться.
- `@dns/constants` — `AUTH_POLICY` (довжина пароля, TTL коду, ліміт спроб,
  cost bcrypt).

## Security & edge cases

- Пароль довший за 72 байти **відхиляється**, а не обрізається: bcrypt читає
  лише перші 72 байти, тож два різні довгі паролі стали б взаємозамінними.
  Ліміт саме в байтах — кирилична літера це два, і 40-символьна фраза вже за
  межею.
- Лічильник спроб інкрементується **перед** киданням помилки, інакше код можна
  було б перебирати 10⁶ разів, а ліміт був би декоративним.
- Видача нового коду видаляє попередній (FR-006), тож у кожен момент живий
  рівно один.
- pino-конфіг редагує `code`, `codeHash`, `password`, `passwordHash` — інакше
  один `logger.log({ user })` відправив би хеш у сховище логів.

## Rollout

- Feature flag: немає.
- Порядок: БД-міграція → деплой `client-api` → реліз мобільного застосунку.
- До налаштування `RESEND_API_KEY` листи не надсилаються, а пишуться в лог —
  придатно для дев-стенду, неприйнятно для продакшену.

## Verification

- `apps/client-api/test/auth-otp.db-spec.ts` — ліміт спроб (правильний код
  після вичерпання не працює), інвалідизація попереднього коду при перевидачі,
  одноразовість, повторна реєстрація на підтверджений і непідтверджений акаунт.
- Смоук: `register` → код у логах (stub) → `verify-email` → 200 з парою
  токенів; повторний `register` на ту саму адресу → 409 `auth.email-taken`.

## Related

- Spec: [./spec.md](./spec.md)
- Plan (OAuth-гілка FR-011…FR-013): [../sign-in/plan.md](../sign-in/plan.md)
- Plan (токени): [../session/plan.md](../session/plan.md)
- ADRs: [ADR-0003](../../../../adr/0003-auth-model-tokens-and-admin-permissions.md)
