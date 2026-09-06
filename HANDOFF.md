# Backend handoff — стан робіт

> Робочий журнал реалізації бекенду. Оновлюється після кожного коміту.
> Гілка: `feat/backend-foundation` (від `development`).
> План: `C:\Users\olehc\.claude\plans\cozy-wishing-karp.md`

**Останнє оновлення:** 2026-09-06

---

## Прийняті рішення

Зафіксовані в ADR — читати їх, а не цей розділ, якщо потрібні деталі й
альтернативи.

| Рішення                                                                    | Де                                                                   |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| NestJS 11 + Drizzle + nestjs-zod, модульний моноліт, DDD-lite              | [ADR-0001](docs/adr/0001-nestjs-drizzle-modular-monolith.md)         |
| Два сервіси: `client-api` :3000 і `admin-api` :3001, без префікса `/admin` | [ADR-0002](docs/adr/0002-split-client-and-admin-api.md)              |
| Окремі `users` і `admins`, ланцюжки сесій на пристрій, deny-by-default     | [ADR-0003](docs/adr/0003-auth-model-tokens-and-admin-permissions.md) |

Додатково, поза ADR:

- База одна на обидва сервіси, через `packages/database` (`@dns/database`).
- Email — Resend; без `RESEND_API_KEY` вмикається stub-клієнт, що пише лист
  у лог. `OTP_DEV_CODE` фіксує код для локальної розробки.
- Патерни портуються з `D:\PhpstormProjects\11am-app` — `apps/mobile-api/CLAUDE.md`
  і `apps/mobile-api/.claude/skills/`.

### Прийняте припущення (не підтверджене замовником)

Шляхи клієнтського API виводимо зі специфікацій `docs/` і TODO-міток у
мобілці. `.claude/knowledge/**` — довідник **доменної моделі** (таблиці,
поля, енуми, формули), а не контракт URL: він описує V1 на Supabase.
Кожен конкретний шлях фіксується в `plan.md` свого зрізу.

---

## Зроблено

### Зріз 0 — ADR і вирівнювання доків ✅

| Коміт                                                        | Що                                                                                                                    |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `docs(adr): nestjs and drizzle modular monolith`             | ADR-0001                                                                                                              |
| `docs(adr): split client-api and admin-api`                  | ADR-0002                                                                                                              |
| `docs(adr): auth model, tokens and admin permissions`        | ADR-0003                                                                                                              |
| `docs: realign api topology to client-api and admin-api`     | 19 файлів: `docs/CLAUDE.md`, bucket- і домен-README, `docs/templates/plan.md`, root `CLAUDE.md`, `packages/CLAUDE.md` |
| `chore: env vars and workspace scripts for two api services` | `.env.example` переписано, скрипти `dev:client-api` / `dev:admin-api`                                                 |

ADR-0003 закрив сім `[NEEDS CLARIFICATION]` зі специфікацій `client/auth/*`:
TTL токенів (15 хв / 30 днів), реакція на повторне використання ротованого
токена, політика пароля, TTL коду (10 хв), ліміт спроб (5), пороги
rate-limit. Самі специфікації ще не оновлені — це робота зрізу 2 разом із
`plan.md`.

### Зріз 1 — фундамент 🚧

| Коміт                                                                                  | Пакет                                 | Що                                                                                                                                                                                                          |
| -------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `feat(shared-types): api envelope and pagination contract`                             | `@dns/shared-types`                   | `ApiResponse`, `PaginatedResponse`, `PaginationMeta/Query`, `ApiError`                                                                                                                                      |
| `feat(constants): languages, measurement units and macro formulas`                     | `@dns/shared-types`, `@dns/constants` | енуми `Language` (20 локалей), `MeasurementUnit`, `MetricSystem`, `Macros`; `SUPPORTED_LANGUAGES`, `calculateCalories` (Atwater), 3 тести                                                                   |
| `feat(database): drizzle connection module and base repository`                        | `@dns/database`                       | `DatabaseConnectionModule.forRootAsync`, `DATABASE_CONNECTION`, `BaseRepository`, `drizzle.config.ts`, власний раннер міграцій `src/migrate.ts`, заглушка сіду                                              |
| `feat(api-common): exception filter, response interceptor, throttler guard and logger` | `@dns/api-common`                     | `GlobalExceptionFilter` (422 для Zod, прокидання `code`/`errors`, 500 без витоку), `ResponseInterceptor` (`{data}`), `CustomThrottlerGuard` + `@SetThrottleKey`, pino-конфіг із редакцією секретів, 4 тести |

---

## Далі

### Зріз 1 — лишилось

- [ ] `@dns/api-infrastructure` — `email/` (Resend + stub), `otp/`, `oauth/`
      (Apple, Google), `storage/` (S3/MinIO presigned)
- [ ] `apps/client-api` — bootstrap: config, logger, Swagger `/docs`,
      префікс `api/v1`, глобальні pipe/filter/interceptor/guard, `/health`
- [ ] `apps/admin-api` — те саме на :3001

### Зріз 2 — client auth

- [ ] схема БД: `users`, `refresh_tokens`, `otp_codes`, `oauth_identities` + перша міграція
- [ ] `@dns/validation` — auth-схеми (переюзає мобілка у формах)
- [ ] `@dns/constants` — auth-політика (TTL коду, ліміт спроб, довжина
      пароля, cost bcrypt) — на це вже посилається коментар у `.env.example`
- [ ] реєстрація з кодом на email, вхід, ротація refresh, logout / logout-all
- [ ] скидання пароля, OAuth Apple/Google
- [ ] db-тести auth-флоу
- [ ] 4 × `plan.md`, статуси специфікацій → `Implemented`, оновлення
      `.claude/knowledge/auth/`

### Поза цим планом

`client/user` → `client/nutrition` → `client/recipe` → admin-зрізи (їм
спершу потрібні специфікації: у `docs/specs/admin/` зараз лише README).
Підключення мобілки до живого API — окремий трек.

---

## Свідомі відхилення від плану

- **`@dns/utils` не створено.** У плані був, але жодного спільного хелпера
  ще не знадобилось — створимо разом із першим, а не наперед.
- **`ADMIN_PERMISSION_MATRIX` ще немає.** ADR-0003 його визначає, але
  споживач з'явиться в admin-зрізі; додамо тоді ж.
- **`packages/CLAUDE.md` послаблено** для `@dns/constants`: пакет тепер
  явно може імпортувати `@dns/shared-types` (types-only, нульова runtime-
  залежність), інакше він не міг би типізувати власні значення.

## Відомі борги

- `.claude/skills/web/{architecture,data-layer}/SKILL.md` досі описують
  доступ через `supabase` з `@dns/api` — суперечать правилу «API-first» у
  root `CLAUDE.md`. Не чіпав: це не топологія бекенду, потрібне окреме
  рішення щодо веб-скілів.
- `.claude/knowledge/**` описує V1 на Supabase. Оновлюється подомено після
  кожного зрізу — правило вже в `docs/CLAUDE.md`.
- Веб-адмінка викликає ~8 ендпоінтів, яких немає ні в knowledge, ні в
  жодній специфікації (`/admin/favorites/*`, `/admin/support-messages/*`,
  `/admin/notifications/*`, `/admin/users/:id/block`, `/admin/languages`,
  `/admin/upload/recipe-image`). Їх доведеться проєктувати з коду адмінки —
  і спершу написати для них специфікації.
- `apps/web` ще не переведено на :3001 і не знято префікс `/admin` з
  дев'яти `*.api.ts` — робиться разом із першим admin-зрізом, щоб не
  ламати адмінку раніше, ніж з'явиться бекенд.

---

## Як перевірити локально

```bash
docker compose up -d          # postgres:16, redis:7, minio + бакет
cp .env.example .env
pnpm install
pnpm typecheck && pnpm lint
```

Наскрізна перевірка auth з'явиться після зрізу 2 — сценарій описано в
плані, розділ Verification.
