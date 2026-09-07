---
spec: ./spec.md
status: Implemented
owner: '@amelin0'
created: 2026-09-07
updated: 2026-09-07
related-adrs: [ADR-0002, ADR-0003, ADR-0004]
related-runbooks: []
---

# Plan: Sign in (Вхід в адмінпанель)

## Summary

Порт клієнтського auth-модуля на `apps/admin-api` з трьома відмінностями,
яких вимагає [ADR-0003](../../../../adr/0003-auth-model-tokens-and-admin-permissions.md):
окрема таблиця `admins` (FR-001, FR-004), свої JWT-секрети, і роль у
корисному навантаженні токена. FR-006 закриває вже наявний
`CustomThrottlerGuard`, FR-012 — той самий ланцюжок ротації refresh-токенів,
що працює в клієнті. Нового тут мало: свідомо, бо auth — не місце для
другої реалізації.

**Веб-клієнт доведеться правити.** Він писався під V1: `/admin/auth/login`,
`snake_case`, плоска відповідь. ADR-0002 каже, що адмін-сервіс **не має**
префікса `/admin` (його розрізняє піддомен), ADR-0004 — camelCase і конверт
`{data}`. Рішення від 2026-09-07: **прогинається веб**, бо це один шар в
одному застосунку одноразово, а альтернатива — два наші API, що назавжди
говорять по-різному.

## Database

### Table `admins`

Окрема таблиця, не роль у `users`. Причина в ADR-0003: інший життєвий цикл
(адмін не реєструється сам і не видаляє себе), інший набір полів, і — головне
— запит «видали користувача» ніколи не повинен мати змоги зачепити адміна.

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `email` | `text` | NOT NULL, UNIQUE (citext-подібне порівняння через `lower(email)`) |
| `password_hash` | `text` | NOT NULL |
| `full_name` | `text` | NOT NULL |
| `role` | `admin_role` | NOT NULL, DEFAULT `'admin'` |
| `is_active` | `boolean` | NOT NULL, DEFAULT `true` |
| `last_login_at` | `timestamptz` | NULL |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` |

Enum `admin_role`: `admin`, `super_admin`.

Indexes:
- `admins_email_key` — UNIQUE на `lower(email)`; вхід шукає без урахування
  регістру, а два акаунти `Ivan@` і `ivan@` — це готовий інцидент.

### Table `admin_refresh_tokens`

Дзеркало `refresh_tokens` клієнта, включно з ланцюжками ротації (FR-012).

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK — їде в токені як `jti`, тож поновлення це одне індексоване читання |
| `admin_id` | `uuid` | NOT NULL → `admins.id` ON DELETE CASCADE |
| `family_id` | `uuid` | NOT NULL — сталий на весь ланцюжок одного браузера |
| `token_hash` | `text` | NOT NULL |
| `expires_at` | `timestamptz` | NOT NULL |
| `rotated_at` | `timestamptz` | NULL — проставляється в мить обміну |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` |

Рядок при ротації **не видаляється**: витрачений лишається з `rotated_at`, і
саме це дозволяє відрізнити повторне пред'явлення від невідомого токена —
без чого крадіжка невиявна. `ip` і `user_agent` тут не потрібні: джерело
запиту фіксує `admin_login_attempts`, і дублювати його на кожній ротації
означало б писати те саме двічі.

Indexes:
- `admin_refresh_tokens_admin_id_idx` on `(admin_id)` — вихід і деактивація
  відкликають усе за адміном (FR-007, FR-008).
- `admin_refresh_tokens_family_id_idx` on `(family_id)` — виявлення повторного
  використання відкликає весь ланцюжок одним запитом.

Токен зберігається **хешем**: дамп бази не має видавати діючі сесії.

### Table `admin_login_attempts`

FR-009. Окремо від throttler'а: той тримає лічильники в пам'яті процесу і
зникає з рестартом, а це — слід для розслідування.

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `email` | `text` | NOT NULL — рядок, **не** FK: невдалі спроби на неіснуючий email теж цікаві |
| `admin_id` | `uuid` | NULL → `admins.id` ON DELETE SET NULL |
| `ip` | `text` | NULL — **не** `inet`: значення приходить із `X-Forwarded-For`, який контролює клієнт, і типізована колонка зробила б зіпсований заголовок 500-кою на маршруті входу |
| `user_agent` | `text` | NULL |
| `succeeded` | `boolean` | NOT NULL |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` |

Indexes:
- `admin_login_attempts_email_time_idx` on `(email, created_at desc)`
- `admin_login_attempts_time_idx` on `(created_at desc)` — прибирання старих

### Migrations

- `0012_hot_frog_thor.sql` — три таблиці, enum `admin_role`. Ім'я згенерував
  drizzle-kit; міграція написана не руками, щоб схема і SQL не розійшлися.

## API contract

Базовий шлях — `/api/v1`, **без** `/admin`: сервіс живе на власному порту й
піддомені (`dev.api.admin.rationfit.com`), і префікс дублював би те, що вже
сказано доменним іменем (ADR-0002). Конверт `{ data }` і camelCase —
ADR-0004, як у client-api.

### `POST /api/v1/auth/login`

**Auth:** none. **Throttle:** дві осі (FR-006) — `ThrottleKey.Login` 10 за 15 хв
за джерелом запиту, і **лічильник у базі** 5 невдалих за 15 хв за адресою.
Перша зупиняє розпилення по багатьох акаунтах з однієї машини, друга — перебір
одного акаунта звідусіль; жодна не покриває випадок іншої.

```json
{ "email": "editor@rationfit.com", "password": "…" }
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `email` | string | так | email, нормалізується до нижнього регістру |
| `password` | string | так | 1..200 — тут не місце для політики пароля |

**Response 200:**

```json
{
  "data": {
    "accessToken": "…",
    "refreshToken": "…",
    "admin": { "id": "…", "email": "…", "fullName": "…", "role": "admin" }
  }
}
```

**Errors:**

- `401` — **єдина** відповідь на «немає такого email», «пароль не той»,
  «акаунт деактивовано» і «це користувач застосунку, не адмін»
  (FR-003, FR-004, FR-008). Код помилки один: `INVALID_CREDENTIALS`.
- `429` — ліміт вичерпано.

⚠️ Порівняння пароля виконується **завжди**, навіть коли акаунта немає —
проти фіктивного хеша. Ранній `return` на невідомому email дає відповідь за
мілісекунди замість сотні, і форма входу стає довідником співробітників
(SC-002).

### `POST /api/v1/auth/refresh`

**Auth:** none (сам refresh-токен і є посвідченням).

```json
{ "refreshToken": "…" }
```

**Response 200:** нова пара, як у `login`.

**Errors:**

- `401` — токен невідомий, протермінований або **вже витрачений**.
  Повторне використання відкликає весь ланцюжок: це або гонка вкладок, або
  крадіжка, і другий випадок дорожчий (FR-012).

### `POST /api/v1/auth/logout`

**Auth:** Bearer. Відкликає **весь ланцюжок** поточної сесії, не один токен
(FR-007). Ідемпотентний: повторний виклик — теж `204`.

**Response 204.**

### `GET /api/v1/auth/me`

**Auth:** Bearer. Те, чим `AuthGuard` у панелі має замінити довіру до
`localStorage`.

```json
{ "data": { "id": "…", "email": "…", "fullName": "…", "role": "admin" } }
```

**Errors:** `401` — токен недійсний, або акаунт деактивовано (FR-008).

## Environment variables

| Variable | Description | Required | Default |
|---|---|---|---|
| `ADMIN_JWT_SECRET` | Підпис access-токенів адмінки | так | — |
| `ADMIN_JWT_REFRESH_SECRET` | Підпис refresh-токенів | так | — |
| `ADMIN_JWT_EXPIRES_IN` | TTL access | ні | `15m` |
| `ADMIN_JWT_REFRESH_EXPIRES_IN` | TTL refresh | ні | `30d` |
| `SEED_ADMIN_EMAIL` | Email першого SUPER_ADMIN для сіду | ні | — |
| `SEED_ADMIN_PASSWORD` | Його пароль | ні | — |

Перші дві вже є в `.env.example` і **не** збігаються з клієнтськими: access
адмінки, підписаний клієнтським секретом, інакше приймався б клієнтським API.

`ADMIN_JWT_EXPIRES_IN` — 15 хвилин, як у клієнта, але **на затримку
відкликання це не впливає**: `AdminJwtStrategy` перечитує рядок на кожному
запиті, тож деактивований адмін втрачає доступ негайно, а не коли
протермінується його токен. Ціна — одне індексоване читання на запит, і на
поверхні з десятком користувачів і повним доступом до контенту це правильний
обмін. SC-003 обіцяє «не пізніше ніж за 15 хвилин»; фактично — одразу.

### Найперший адмін

`pnpm db:seed:admin` створює SUPER_ADMIN із `SEED_ADMIN_*`, ідемпотентно:
якщо email уже є — no-op, пароль не перезаписується. Рішення від 2026-09-07:
не міграцією, бо пароль осів би в git назавжди й був би однаковий на всіх
середовищах, а dev-сервер дивиться в інтернет.

Змінні читаються **тільки** цим скриптом. У середовищі, де їх немає, скрипт
чесно каже, що не має що робити, замість створювати акаунт із порожнім
паролем.

## File structure

```
packages/database/src/schema/admins.schema.ts
packages/database/src/schema/admin-refresh-tokens.schema.ts
packages/database/src/schema/admin-login-attempts.schema.ts
packages/database/src/migrations/0012_admins_and_admin_sessions.sql
packages/database/src/repositories/admin.repository.ts
packages/database/src/seeds/admin.seed.ts

packages/validation/src/admin-auth.schemas.ts
packages/shared-types/src/admin.ts            # AdminRole

apps/admin-api/src/modules/auth/
  auth.controller.ts  auth.service.ts  auth.module.ts
  strategies/jwt.strategy.ts
  guards/{jwt.guard.ts,roles.guard.ts}
  decorators/{current-admin.decorator.ts,roles.decorator.ts,public.decorator.ts}

apps/web/src/data/remote/domains/auth/{auth.api.ts,auth.types.ts}   # шляхи + camelCase
apps/web/src/shared/services/http.service.ts                        # {data}, refresh
```

## Shared contract

- `@dns/shared-types` — `AdminRole` (`admin` | `super_admin`),
  `AdminSession`, `AdminProfile`. Споживає admin-api і `apps/web`.
- `@dns/validation` — `adminLoginSchema`, `adminRefreshSchema`. Веб валідує
  форму тими самими схемами, що й сервер запит.

## Security & edge cases

- **Хешування** — bcrypt, cost 12, як у клієнта.
- **Нерозрізнювані відмови** — один код `INVALID_CREDENTIALS` на чотири
  різні причини, і фіктивне порівняння для вирівнювання часу (FR-003).
- **Ліміт** — 5 невдалих за 15 хвилин на email **і** на IP. Дві осі, бо одна
  осі не буває достатньо: перебір по одному акаунту і розпилення по багатьох
  акаунтах з однієї адреси — різні атаки (FR-006).
- **Ротація refresh** — кожне поновлення видає нову пару і гасить попередню;
  повторне пред'явлення відкликає ланцюжок. Це ловить крадіжку токена,
  але ціною: **дві вкладки, що поновлюються одночасно, гасять одна одну.**
  Пом'якшення — вікно пільги 10 секунд, протягом якого щойно витрачений токен
  видає **ще одну** пару в тому ж ланцюжку, замість відкликати його. Саме ще
  одну, а не копію попередньої: ми зберігаємо лише хеш і не можемо відтворити
  вже виданий токен.
- **Деактивація** — `is_active = false` плюс відкликання всіх refresh цього
  адміна. Access живе до 15 хвилин; це свідомий компроміс (SC-003).
- **`/auth/me` не кешується** — саме на ньому панель дізнається, що акаунт
  деактивували.
- **Журнал спроб не має ставати вектором** — `admin_login_attempts` росте на
  кожну спробу входу, включно з атакою. Прибирання старших за 90 днів
  входить у зріз, а не «колись потім».

## Rollout

- Feature flag: немає.
- Порядок: міграція → `db:seed:admin` → деплой admin-api → правки `apps/web`
  → деплой на Vercel. **Веб ламається між третім і четвертим кроком** —
  на dev це прийнятно, бо панеллю ще ніхто не користується. Для prod
  порядок був би зворотним, через сумісність на два контракти.
- Зворотна сумісність: не потрібна — сервера ще не існує.

### Що увійшло понад мінімум

`GET /admins` і `PATCH /admins/:id` — під `@Roles(SUPER_ADMIN)`. Без них
FR-008 і User Story 4 лишилися б механізмом без способу ним скористатися.
Створення акаунтів свідомо не входить: інвайт потребує доставки листа й
продуктового рішення, що новий адмін бачить першим. Заборонено міняти власну
роль і активність — так організація не лишається без жодного SUPER_ADMIN.

## Verification

- Unit: хешування, нерозрізнюваність відмов (FR-003), ротація і виявлення
  повторного використання (FR-012).
- DB-тести (`test:db`), як у решті доменів: вхід, невірний пароль,
  деактивований акаунт, користувач застосунку з тим самим email, ліміт
  спроб, вихід гасить ланцюжок, деактивація гасить сесії.
- Тест на **вирівнювання часу**: різниця медіан відповіді для існуючого і
  неіснуючого email не більша за поріг. Без нього FR-003 виконано на
  папері, а не насправді.
- Смоук після деплою:
  `POST /api/v1/auth/login` → 200; невірний пароль → 401;
  `GET /api/v1/auth/me` без токена → 401.
- Метрики: частка 401 на `/auth/login` у Grafana. Різкий стрибок — або
  перебір, або ми щойно зламали вхід.

## Related

- Spec: [./spec.md](./spec.md)
- ADRs: [ADR-0002](../../../../adr/0002-split-client-and-admin-api.md),
  [ADR-0003](../../../../adr/0003-auth-model-tokens-and-admin-permissions.md),
  [ADR-0004](../../../../adr/0004-client-api-url-conventions.md)
