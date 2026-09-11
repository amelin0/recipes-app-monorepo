---
spec: ./spec.md
status: Implemented
owner: '@amelin0'
created: 2026-09-06
updated: 2026-09-11
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

| Column          | Type          | Constraints                                                         |
| --------------- | ------------- | ------------------------------------------------------------------- |
| `id`            | `uuid`        | PK, `gen_random_uuid()`; їде в токені як `jti`                      |
| `user_id`       | `uuid`        | NOT NULL, FK → `users.id`                                           |
| `family_id`     | `uuid`        | NOT NULL; сталий у межах ланцюжка одного пристрою                   |
| `token_hash`    | `text`        | NOT NULL; bcrypt від повного токена                                 |
| `expires_at`    | `timestamptz` | NOT NULL                                                            |
| `rotated_at`    | `timestamptz` | NULL, поки токен не обміняли; ставиться умовним `UPDATE`            |
| `grace_used_at` | `timestamptz` | NULL; друге подовження в межах вікна забрало свою пару (див. нижче) |
| `created_at`    | `timestamptz` | NOT NULL, `now()`                                                   |

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
- Наступна міграція (генерується під час інтеграції гілки
  `fix/client-auth-races`) — `refresh_tokens.grace_used_at`.

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
- `403` `auth.account-blocked` — токен справжній, але акаунт заблоковано.
- `429` — перевищено ліміт.

**Паралельні подовження одним токеном (вікно grace, 10 с, одноразове).**
Мобільний застосунок може вистрілити два `refresh` тим самим токеном
одночасно. Рівно один із них ротує токен. **Ще один**, що прийшов протягом
`AUTH_POLICY.refreshRotationGraceSeconds` (10 с) після ротації, отримує
окрему пару-«сестру» в тому самому ланцюжку — обидві пари робочі, застосунок
тримає ту, що отримав останньою. **Третє** і кожне наступне пред'явлення того
самого токена — повтор: 401 і відкликання всього ланцюжка, включно з двома
щойно виданими парами, як і пред'явлення після вікна. На відміну від адмінки
(там вікно не обмежене кількістю), тут украдений токен у кращому разі дає
одну пару і лише всередині вікна.

### `POST /auth/logout`

**Auth:** none (`@Public`)

**Request body:** `{ "refreshToken": "<jwt>" }`

**Response 204** — завжди, чинний токен чи ні. Тому, хто виходить, немає з
чого зробити висновок про валідність токена.

### `POST /auth/logout-all`

**Auth:** `JwtGuard` (Bearer)

**Response 204** — видаляє всі ланцюжки акаунту (FR-007). Виграє в
подовження, що саме виконується: див. «Security & edge cases».

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
  транзакція ротації. Звірка хешу стоїть перед будь-яким записом навмисно:
  токен із валідним підписом, але чужим тілом зроблений тим, хто має секрет,
  а не виданий нами. Якби ми трактували його як повтор, будь-хто здатний
  підробити токен міг би відкликати живий ланцюжок жертви. bcrypt (звірка і
  хеш нового токена) виконується **до** транзакції — під блокуванням рядка він
  тримав би кожне відкликання на час хешування.
- **Ротація — одна транзакція `RefreshTokenRepository.rotate`**:
  `SELECT … FROM users WHERE id = $user FOR SHARE` → перевірка «підтверджений,
  не заблокований» → `UPDATE refresh_tokens SET rotated_at = now() WHERE id =
$jti AND rotated_at IS NULL AND expires_at > now() RETURNING family_id` →
  вставка нащадка. Нуль рядків ⇒ пробуємо одноразовий grace
  (`… SET grace_used_at = now() WHERE rotated_at > now() - 10 s AND
grace_used_at IS NULL`), інакше — повтор. Із N паралельних подовжень
  одного токена рівно одне ротує, рівно одне (у межах вікна) отримує сестру.
- **Відкликання завжди виграє в подовження в польоті.** Кожен шлях, що
  видає refresh (вхід, ротація), бере `FOR SHARE` на рядок `users`; кожне
  відкликання (`logout`, `logout-all`, скидання пароля, блокування з адмінки)
  спершу бере `FOR NO KEY UPDATE` на той самий рядок і лише потім видаляє.
  Блокування конфліктують, тож одна сторона чекає коміту іншої: якщо чекає
  відкликання, його `DELETE` — новий statement під READ COMMITTED — бачить
  щойно вставленого нащадка; якщо чекає подовження, воно перечитує акаунт і не
  знаходить свого батьківського токена. `FOR NO KEY UPDATE`, а не `FOR UPDATE`:
  він не конфліктує з `FOR KEY SHARE` перевірок зовнішніх ключів, тож не
  гальмує вставки в інші таблиці акаунту. Ізоляція **READ COMMITTED свідомо**:
  під REPEATABLE READ `DELETE` читав би знімок, зроблений до очікування, і
  пропустив би саме той токен.
- **Відкликання ланцюжка при повторі — окрема, друга транзакція** з
  блокуванням відкликання: вона дочікується всіх ротацій акаунту в польоті
  (включно з сестрою, яку саме видають) і видаляє і їхні токени. В одній
  транзакції це було б підвищення спільного блокування, яке тримають і інші
  подовження, — взаємоблокування.
- **Свіжий вхід** (`openSession`) зберігає токен під тим самим `FOR SHARE` і
  повторно перевіряє блокування та **хеш пароля, який щойно звірили**: вхід
  старим паролем, що перетнувся зі скиданням пароля, або відмовляє, або його
  сесію видаляє скидання.
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
  одного ланцюжка, незалежність пристроїв, відкликання при повторі (після
  вікна), відмова підробленому токену без відкликання, «вийти всюди».
- `apps/client-api/test/auth-refresh-races.db-spec.ts` — паралельність:
  дві одночасні ротації → обидві успішні в одному ланцюжку; пачка з 6 → рівно
  2 успішні, ланцюжок відкликано; grace одноразовий і послідовно; `logout-all`,
  `logout`, блокування, скидання пароля проти ротації в польоті і скидання
  проти входу старим паролем — жодного токена не лишається (кожна гонка 10
  разів).
- Смоук після деплою: `POST /auth/refresh` тричі з тим самим токеном протягом
  10 с — друга спроба дає 200 (пара-сестра), третя 401, і обидві видані пари
  теж мають померти.

## Related

- Spec: [./spec.md](./spec.md)
- ADRs: [ADR-0002](../../../../adr/0002-split-client-and-admin-api.md),
  [ADR-0003](../../../../adr/0003-auth-model-tokens-and-admin-permissions.md)
