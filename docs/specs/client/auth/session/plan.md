---
spec: ./spec.md
status: Implemented
owner: '@amelin0'
created: 2026-09-06
updated: 2026-09-06
related-adrs: [ADR-0002, ADR-0003]
related-runbooks: []
---

# Plan: Session (Сесія і токени)

## Summary

FR-001…FR-002, FR-006…FR-008 лягають на `TokenService` у
`apps/client-api/src/modules/auth/` і таблицю `refresh_tokens`. FR-003…FR-005
— клієнтські, реалізовані в `apps/mobile/src/shared/services/http.service.ts`
(single-flight подовження, очищення сесії на невідновному 401) і бекенду не
стосуються.

Строки життя токенів, реакція на повторне використання ротованого токена й
модель ланцюжків — рішення ADR-0003; тут описано лише відображення на код.

## Database

### Table `refresh_tokens`

| Column       | Type          | Constraints                                       |
| ------------ | ------------- | ------------------------------------------------- |
| `id`         | `uuid`        | PK, `gen_random_uuid()`; їде в токені як `jti`    |
| `user_id`    | `uuid`        | NOT NULL, FK → `users.id`                         |
| `family_id`  | `uuid`        | NOT NULL; сталий у межах ланцюжка одного пристрою |
| `token_hash` | `text`        | NOT NULL; bcrypt від повного токена               |
| `expires_at` | `timestamptz` | NOT NULL                                          |
| `rotated_at` | `timestamptz` | NULL, поки токен не обміняли                      |
| `created_at` | `timestamptz` | NOT NULL, `now()`                                 |

Indexes:

- `refresh_tokens_user_id_idx` on `(user_id)` — «вийти всюди» і чистка.
- `refresh_tokens_family_id_idx` on `(family_id)` — відкликання одного ланцюжка.

Relations:

- `user_id` → `users.id` ON DELETE CASCADE

**Чому рядок не видаляється при ротації.** Спожитий токен лишається з
заповненим `rotated_at`. Без цього повторне пред'явлення не відрізнити від
невідомого токена, і крадіжка не детектується (FR-006 у spec, Edge Cases).

**Чому `jti`, а не пошук по хешу.** Хеш bcrypt не шукається запитом, тож без
`jti` довелося б порівнювати пред'явлений токен з усіма рядками користувача —
по ~50 мс кожен. `jti` дає одне індексоване читання і одне порівняння.

### Migrations

- `0000_thin_iceman.sql` — `users`, `refresh_tokens`, `otp_codes`,
  `password_reset_permits`, `oauth_identities`.

## API contract

Базовий шлях: `http://<client-api>/api/v1`.

### `POST /auth/refresh`

**Auth:** none (`@Public`), throttle-ключ `refresh-token`

**Request body:**

```json
{ "refreshToken": "<jwt>" }
```

| Field          | Type   | Required | Validation                        |
| -------------- | ------ | -------- | --------------------------------- |
| `refreshToken` | string | yes      | непорожній (`refreshTokenSchema`) |

**Response 200:**

```json
{ "data": { "accessToken": "<jwt>", "refreshToken": "<jwt>" } }
```

**Errors:**

- `401` `auth.invalid-refresh-token` — невідомий, прострочений, спожитий або
  підроблений токен. Причина не деталізується: інакше відповідь стає оракулом
  про те, які `jti` існують.
- `429` — перевищено ліміт.

### `POST /auth/logout`

**Auth:** none (`@Public`)

**Request body:** `{ "refreshToken": "<jwt>" }`

**Response 204** — завжди, чинний токен чи ні. Тому, хто виходить, немає з
чого зробити висновок про валідність токена.

### `POST /auth/logout-all`

**Auth:** `JwtGuard` (Bearer)

**Response 204** — видаляє всі ланцюжки акаунту (FR-007).

**Errors:** `401` — немає/прострочений access-токен.

### `GET /auth/me`

**Auth:** `JwtGuard` (Bearer)

**Response 200:**

```json
{ "data": { "id": "<uuid>", "email": "user@example.com", "emailVerifiedAt": "2026-09-06T12:00:00.000Z" } }
```

Дає застосунку спосіб підтвердити, чию сесію він тримає, на старті. Профіль
(ім'я, цілі, налаштування) — домен `user`, не тут.

## Environment variables

| Variable                                | Description                                 | Required | Default        |
| --------------------------------------- | ------------------------------------------- | -------- | -------------- |
| `JWT_SECRET`                            | підпис access-токенів                       | yes      | —              |
| `JWT_EXPIRES_IN`                        | строк життя access                          | no       | `15m`          |
| `JWT_REFRESH_SECRET`                    | підпис refresh-токенів **і** permit-токенів | yes      | —              |
| `JWT_REFRESH_EXPIRES_IN`                | строк життя refresh                         | no       | `30d`          |
| `THROTTLE_REFRESH_TOKEN_TTL` / `_LIMIT` | вікно і ліміт `/auth/refresh`               | no       | `60000` / `10` |

## File structure

```
apps/client-api/src/modules/auth/token.service.ts        # видача, ротація, відкликання
apps/client-api/src/modules/auth/auth.types.ts           # payload-и трьох типів токенів
apps/client-api/src/modules/auth/strategies/jwt.strategy.ts
apps/client-api/src/modules/auth/guards/jwt.guard.ts
apps/client-api/src/modules/auth/decorators/{current-user,public}.decorator.ts
packages/database/src/schema/refresh-tokens.schema.ts
packages/database/src/entities/refresh-token.entity.ts
packages/database/src/repositories/refresh-token/
apps/mobile/src/shared/services/http.service.ts          # FR-003…FR-005, вже є
```

## Shared contract

- `@dns/shared-types` — `AuthTokens { accessToken, refreshToken }`.
- `@dns/validation` — `refreshTokenSchema`.

## Security & edge cases

- **Явний `type` у кожному токені** (`access` | `refresh` | `password-reset`),
  і кожен споживач його перевіряє. Без цього токени відрізняються лише тим,
  яким ключем підписані, і будь-які два флоу зі спільним секретом стають
  взаємозамінними — permit проходив би як access-токен.
- **Порядок перевірок у ротації**: підпис → рядок за `jti` → **звірка хешу** →
  ознака повторного використання → строк дії. Звірка хешу стоїть перед
  перевіркою на повтор навмисно: токен із валідним підписом, але чужим тілом
  зроблений тим, хто має секрет, а не виданий нами. Якби ми трактували його як
  повтор, будь-хто здатний підробити токен міг би відкликати живий ланцюжок
  жертви.
- **Обсяг відкликання при повторі** — рівно один ланцюжок. Не всі сесії: гонка
  двох паралельних подовжень з одного пристрою — штатна ситуація, і вона
  розлогінювала б людину всюди (FR-006).
- `JwtStrategy` перечитує акаунт на кожен запит, а не довіряє claim'ам: токен
  лишається криптографічно валідним усі 15 хвилин, тож видалений акаунт інакше
  працював би до кінця цього вікна.

## Rollout

- Feature flag: немає.
- Порядок: БД-міграція → деплой `client-api` → реліз мобільного застосунку.
- Зворотна сумісність: не потрібна, перший реліз API.

## Verification

- `apps/client-api/test/auth-tokens.db-spec.ts` — 5 сценаріїв: ротація в межах
  одного ланцюжка, незалежність пристроїв, відкликання при повторі, відмова
  підробленому токену без відкликання, «вийти всюди».
- Смоук після деплою: `POST /auth/refresh` двічі з тим самим токеном — друга
  спроба має дати 401, а видана між ними пара теж має померти.

## Related

- Spec: [./spec.md](./spec.md)
- ADRs: [ADR-0002](../../../../adr/0002-split-client-and-admin-api.md),
  [ADR-0003](../../../../adr/0003-auth-model-tokens-and-admin-permissions.md)
