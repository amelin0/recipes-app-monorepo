# Backend handoff — стан робіт

> Робочий журнал реалізації бекенду. Оновлюється після кожного коміту.
> Гілка: `feat/backend-foundation` (від `development`).
> План: `C:\Users\olehc\.claude\plans\cozy-wishing-karp.md`

**Останнє оновлення:** 2026-09-06 — фундамент зібрано і перевірено вживу.

---

## Прийняті рішення

Зафіксовані в ADR — читати їх, а не цей розділ, якщо потрібні деталі й
відхилені альтернативи.

| Рішення                                                                    | Де                                                                   |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| NestJS 11 + Drizzle + nestjs-zod, модульний моноліт, DDD-lite              | [ADR-0001](docs/adr/0001-nestjs-drizzle-modular-monolith.md)         |
| Два сервіси: `client-api` :3000 і `admin-api` :3001, без префікса `/admin` | [ADR-0002](docs/adr/0002-split-client-and-admin-api.md)              |
| Окремі `users` і `admins`, ланцюжки сесій на пристрій, deny-by-default     | [ADR-0003](docs/adr/0003-auth-model-tokens-and-admin-permissions.md) |

Додатково, поза ADR:

- База одна на обидва сервіси, через `packages/database` (`@dns/database`).
- Email — Resend; без `RESEND_API_KEY` вмикається stub-клієнт, що пише лист
  у лог. `OTP_DEV_CODE` фіксує код для локальної розробки.
- Патерни портуються з `D:\PhpstormProjects\11am-app` —
  `apps/mobile-api/CLAUDE.md` і `apps/mobile-api/.claude/skills/`.

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

### Зріз 1 — фундамент ✅

| Коміт                                                                                  | Пакет                                 | Що                                                                                                                                                                                                   |
| -------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `feat(shared-types): api envelope and pagination contract`                             | `@dns/shared-types`                   | `ApiResponse`, `PaginatedResponse`, `PaginationMeta/Query`, `ApiError`                                                                                                                               |
| `feat(constants): languages, measurement units and macro formulas`                     | `@dns/shared-types`, `@dns/constants` | енуми `Language` (20 локалей), `MeasurementUnit`, `MetricSystem`, `Macros`; `SUPPORTED_LANGUAGES`, `calculateCalories` (Atwater), 3 тести                                                            |
| `feat(database): drizzle connection module and base repository`                        | `@dns/database`                       | `DatabaseConnectionModule.forRootAsync`, `DATABASE_CONNECTION`, `BaseRepository`, `drizzle.config.ts`, власний раннер міграцій, заглушка сіду                                                        |
| `feat(api-common): exception filter, response interceptor, throttler guard and logger` | `@dns/api-common`                     | `GlobalExceptionFilter` (422 для Zod, прокидання `code`/`errors`, 500 без витоку), `ResponseInterceptor` (`{data}`), `CustomThrottlerGuard` + `@SetThrottleKey`, pino із редакцією секретів, 4 тести |
| `feat(api-infrastructure): email via resend with stub fallback, and otp codes`         | `@dns/api-infrastructure`             | `EmailModule` (Resend або stub залежно від `RESEND_API_KEY`), `OtpModule` (6 цифр через CSPRNG, bcrypt-хеш, `OTP_DEV_CODE`), 3 тести                                                                 |
| `feat(client-api): nestjs bootstrap with config, logger, swagger and health`           | `apps/client-api`                     | :3000, префікс `api/v1`, типізовані конфіги, глобальні pipe/filter/interceptor/guard, Swagger `/docs`, `GET /health`                                                                                 |
| `feat(admin-api): nestjs bootstrap with config, logger, swagger and health`            | `apps/admin-api`                      | :3001, те саме, власні `ADMIN_JWT_*`, коротший набір throttle-правил                                                                                                                                 |

---

## Далі

### Зріз 2 — client auth

- [ ] схема БД: `users`, `refresh_tokens`, `otp_codes`, `oauth_identities` + перша міграція
- [ ] `@dns/validation` — auth-схеми (переюзає мобілка у формах)
- [ ] `@dns/constants` — auth-політика (TTL коду, ліміт спроб, довжина
      пароля, cost bcrypt) — на це вже посилається коментар у `.env.example`
- [ ] реєстрація з кодом на email, вхід, ротація refresh, logout / logout-all
- [ ] скидання пароля, OAuth Apple/Google (+ `oauth/` у `api-infrastructure`)
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
- **`oauth/` і `storage/` в `@dns/api-infrastructure` не створено.** OAuth
  з'явиться разом із кроком «Apple/Google sign-in» у зрізі 2, storage — із
  першою фічею завантаження зображень. `S3_*` у `.env.example` уже готові.
- **`ADMIN_PERMISSION_MATRIX` ще немає.** ADR-0003 його визначає, але
  споживач з'явиться в admin-зрізі; додамо тоді ж.
- **OTP зберігається в БД, а не в Redis.** У 11am код лежить у Redis-кеші й
  ліміту спроб не має. ADR-0003 вимагає лічильник спроб (5), тож
  `OtpService` лишається без стану (генерація + bcrypt-хеш), а рядок,
  строк дії та лічильник належать auth-домену (`otp_codes`).
- **Збірка через webpack, а не tsc.** `paths` вказують на `packages/<pkg>/src`
  поза текою застосунку, тож tsc виводить `rootDir` у корінь монорепо і
  кладе точку входу в `dist/apps/client-api/src/main.js`. Webpack-білдер
  (як у 11am) дає плаский `dist/main.js`: workspace-пакети бандляться,
  решта `node_modules` лишається зовнішньою.
- **`packages/CLAUDE.md` послаблено** для `@dns/constants`: пакет тепер
  явно може імпортувати `@dns/shared-types` (types-only, нульова
  runtime-залежність), інакше він не міг би типізувати власні значення.

## Відомі борги

- **Redis піднятий, але не використовується.** Сховище throttler'а — у
  пам'яті процесу: ліміти скидаються при рестарті й не діють між репліками.
  Для одного інстансу прийнятно; перед горизонтальним масштабуванням
  потрібен Redis-адаптер `@nestjs/throttler`.
- `GET /health` рахується в глобальний ліміт 60/хв. За кількох одночасних
  проб (LB + моніторинг) може почати віддавати 429 — тоді виносимо його
  з-під throttler'а.
- На старті обох сервісів двічі друкується попередження
  `Unsupported route path: "/api/v1/*"` від `LegacyRouteConverter`
  (Nest 11 + Express 5, middleware nestjs-pino). Автоконвертація спрацьовує
  коректно, шум некритичний.
- `pnpm lint` червоний через `apps/web` — 8 помилок
  (`react-hooks/set-state-in-effect`, `react/no-unescaped-entities`).
  Перевірено: рівно ті самі 18 проблем є і на `development`, тобто це
  успадкований борг, а не наслідок цих змін. Не чіпав.
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
cp .env.example .env
pnpm install
pnpm typecheck                 # 9 воркспейсів — зелено
pnpm dev:client-api            # :3000
pnpm dev:admin-api             # :3001
```

Перевірено вручну, обидва сервіси піднімалися одночасно:

| Перевірка                          | Результат                                                                   |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `GET :3000/api/v1/health`          | `{"data":{"status":"ok","time":"…"}}` — конверт `{data}` працює             |
| `GET :3001/api/v1/health`          | те саме, порти не конфліктують                                              |
| `GET :3000/docs`, `GET :3001/docs` | 200, два окремі Swagger-документи                                           |
| Неіснуючий маршрут                 | `{"statusCode":404,"message":"Cannot GET /api/v1/nope"}` — форма `ApiError` |
| 65 запитів поспіль                 | 429 `ThrottlerException`, заголовки `X-RateLimit-*` присутні                |

`docker compose up -d` не запускався — Docker Desktop на машині вимкнений.
Для фундаменту це не блокер: `postgres-js` відкриває з'єднання ліниво, тож
обидва сервіси стартують без бази. БД знадобиться на зрізі 2 (міграції).

Наскрізна перевірка auth з'явиться після зрізу 2 — сценарій описано в
плані, розділ Verification.
