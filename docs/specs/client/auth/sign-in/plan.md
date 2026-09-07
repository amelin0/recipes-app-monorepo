фсдф---
spec: ./spec.md
status: Implemented
owner: '@amelin0'
created: 2026-09-06
updated: 2026-09-06
related-adrs: [ADR-0003]
related-runbooks: []

---

# Plan: Sign-in (Вхід)

## Summary

FR-001…FR-003 лягають на `AuthService.login`, FR-004…FR-006 — на
`OAuthSignInService` і таблицю `oauth_identities`. FR-007 (сесія переживає
перезапуск) реалізовано механікою з [`../session/plan.md`](../session/plan.md).
FR-008 (перемикач видимості пароля, пароль не логується) — клієнтський, з
одним бекендним наслідком: `password` у списку редакції pino. FR-009 —
throttle-ключ `login`.

Цей план також покриває FR-011…FR-013 зі spec sign-up: реєстрація через
провайдера і вхід через провайдера — один механізм, і розводити його на два
документи означало б описати ту саму гілку двічі.

## Database

### Table `oauth_identities`

| Column             | Type             | Constraints                                 |
| ------------------ | ---------------- | ------------------------------------------- |
| `id`               | `uuid`           | PK                                          |
| `user_id`          | `uuid`           | NOT NULL, FK → `users.id` ON DELETE CASCADE |
| `provider`         | `oauth_provider` | NOT NULL — `apple` \| `google`              |
| `provider_user_id` | `text`           | NOT NULL                                    |
| `created_at`       | `timestamptz`    | NOT NULL, `now()`                           |

Indexes:

- `oauth_identities_provider_user_unique` UNIQUE on `(provider, provider_user_id)`

**Звʼязок тримається за `provider_user_id`, ніколи за email.** Приватний релей
Apple може змінитися, і прив'язка за адресою відрізала б власника від власного
акаунту. Один акаунт може мати кілька ідентичностей плюс пароль.

`users.password_hash` — nullable саме заради цієї гілки: акаунт, створений
через провайдера, пароля не має, доки не задасть його через відновлення
(sign-up FR-013).

## API contract

### `POST /auth/login`

**Auth:** none (`@Public`), throttle-ключ `login`

**Request body:** `{ "email": "user@example.com", "password": "..." }`

| Field      | Type   | Required | Validation        |
| ---------- | ------ | -------- | ----------------- |
| `password` | string | yes      | лише «непорожній» |

Пароль на вході **не** проходить політику складності. Наявний акаунт може
тримати пароль, старший за чинну політику, і відмова на вході замкнула б
власника з помилкою валідації замість того, щоб пустити його всередину.

**Response 200:** `{ "data": { "accessToken": "...", "refreshToken": "..." } }`

**Errors:**

- `401` `auth.invalid-credentials` — невідома адреса, невірний пароль, або
  акаунт без пароля (лише через провайдера). Одна відповідь на всі випадки
  (FR-002).
- `403` `auth.email-not-verified` — пароль правильний, але email не
  підтверджено. Сесія не видається, надсилається новий код, застосунок веде на
  екран підтвердження (FR-003). Досяжне лише після правильного пароля, тож
  нічого не розкриває тому, хто акаунтом не володіє.
- `422` — валідація; `429` — ліміт.

### `POST /auth/oauth`

**Auth:** none (`@Public`), throttle-ключ `oauth-google`

**Request body:**

```json
{ "provider": "google", "idToken": "<provider id token>" }
```

| Field      | Type   | Required | Validation                             |
| ---------- | ------ | -------- | -------------------------------------- |
| `provider` | enum   | yes      | `apple` \| `google`                    |
| `idToken`  | string | yes      | непорожній; перевіряється у провайдера |

**Response 200:** пара токенів.

**Errors:**

- `401` — токен провайдера не пройшов перевірку.
- `422` — невідомий провайдер.

**Один ендпоінт на вхід, реєстрацію і прив'язку.** Застосунок не може знати
наперед, чи є в людини акаунт, тож обидві кнопки («Увійти через Google» і
«Зареєструватися через Google») ведуть сюди. Логіка `resolveAccount`:

1. Ідентичність відома → це той самий акаунт, звичайний повторний вхід.
2. Адреса вже має акаунт → **прив'язуємо** ідентичність (FR-006). Інакше той,
   хто зареєструвався паролем і згодом натиснув «Continue with Google»,
   отримав би другий акаунт і втратив свої дані. Непідтверджений акаунт тут же
   стає підтвердженим: провайдер щойно засвідчив володіння адресою — рівно те,
   що просив довести код на пошті.
3. Нікого немає → створюємо акаунт **підтверджений і без пароля**
   (sign-up FR-012).

Apple не повертає email на жодному вході після першого; тоді підставляється
синтетична релейна адреса `<sub>@privaterelay.appleid.com`, щоб задовольнити
NOT NULL. Ця адреса ніколи не є тим, за чим шукається акаунт.

## Environment variables

| Variable                               | Description                             | Required        | Default         |
| -------------------------------------- | --------------------------------------- | --------------- | --------------- |
| `GOOGLE_CLIENT_ID`                     | audience для перевірки Google ID-токена | так, для Google | —               |
| `APPLE_CLIENT_ID`                      | audience для перевірки Apple ID-токена  | так, для Apple  | —               |
| `THROTTLE_LOGIN_TTL` / `_LIMIT`        | вікно і ліміт входу                     | no              | `900000` / `10` |
| `THROTTLE_OAUTH_GOOGLE_TTL` / `_LIMIT` | вікно і ліміт OAuth                     | no              | `60000` / `5`   |

`audience` в перевірці — це те, що робить її перевіркою, а не декодуванням:
без нього сюди пройшов би токен, виданий будь-якому іншому застосунку Google.

## File structure

```
apps/client-api/src/modules/auth/auth.service.ts        # login
apps/client-api/src/modules/auth/oauth.service.ts       # create-or-link
apps/client-api/src/common/config/oauth.config.ts
packages/api-infrastructure/src/oauth/                  # верифікація токенів провайдерів
packages/database/src/schema/oauth-identities.schema.ts
packages/database/src/repositories/oauth-identity/
```

## Shared contract

- `@dns/shared-types` — `OAuthProvider`.
- `@dns/validation` — `loginSchema`, `oauthSignInSchema`.

## Security & edge cases

- **Порівняння пароля виконується завжди**, навіть коли акаунту немає — проти
  згенерованого bcrypt-хешу (`DUMMY_PASSWORD_HASH`). Без цього неіснуюча адреса
  відповідає помітно швидше за невірний пароль, і різниця в часі стає тим самим
  оракулом перебору, який FR-002 закриває. Хеш саме згенерований, а не
  вигаданий: некоректний рядок було б відкинуто до того, як bcrypt зробить
  роботу.
- `password` у списку редакції pino (FR-008): пароль не має потрапити в лог
  навіть усередині payload-а помилки.
- Прив'язка до наявного акаунту не питає підтвердження власника, бо провайдер
  щойно засвідчив володіння тією самою адресою — це той самий доказ, що й код
  на пошті.

## Rollout

- Feature flag: немає.
- Порядок: БД-міграція → деплой `client-api` → реліз мобільного застосунку.
- До заповнення `GOOGLE_CLIENT_ID` / `APPLE_CLIENT_ID` `/auth/oauth` віддає
  401 на будь-який токен — вхід паролем при цьому працює.

## Verification

- `apps/client-api/test/auth-oauth.db-spec.ts` — усі три гілки
  `resolveAccount`, підтвердження акаунту, що чекав на код, і стабільність
  прив'язки при зміні релейної адреси. Перевірка токена провайдера підмінена
  (`FakeOAuthVerifier`), решта виконується по-справжньому.
- `apps/client-api/test/auth-otp.db-spec.ts` — вхід до підтвердження email.
- Смоук: `login` з невірним паролем і з неіснуючою адресою мають дати
  побайтово однакову відповідь.

## Related

- Spec: [./spec.md](./spec.md)
- Plan (токени): [../session/plan.md](../session/plan.md)
- Plan (реєстрація): [../sign-up/plan.md](../sign-up/plan.md)
- ADRs: [ADR-0003](../../../../adr/0003-auth-model-tokens-and-admin-permissions.md)
