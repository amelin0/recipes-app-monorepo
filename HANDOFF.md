# Backend handoff — стан робіт

> Робочий журнал реалізації бекенду. Оновлюється після кожного коміту.
> Гілка: `feat/backend-foundation` (від `development`).
> План: `C:\Users\olehc\.claude\plans\cozy-wishing-karp.md`

**Останнє оновлення:** 2026-09-06 — зріз 6 (onboarding) закрито, перевірено
на живій базі.

---

## Прийняті рішення

Зафіксовані в ADR — читати їх, а не цей розділ, якщо потрібні деталі й
відхилені альтернативи.

| Рішення                                                                    | Де                                                                   |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| NestJS 11 + Drizzle + nestjs-zod, модульний моноліт, DDD-lite              | [ADR-0001](docs/adr/0001-nestjs-drizzle-modular-monolith.md)         |
| Два сервіси: `client-api` :3000 і `admin-api` :3001, без префікса `/admin` | [ADR-0002](docs/adr/0002-split-client-and-admin-api.md)              |
| Окремі `users` і `admins`, ланцюжки сесій на пристрій, deny-by-default     | [ADR-0003](docs/adr/0003-auth-model-tokens-and-admin-permissions.md) |
| Шляхи клієнтського API за REST-конвенціями, `/profile` замість `/users/me` | [ADR-0004](docs/adr/0004-client-api-url-conventions.md)              |
| Чого торкається видалення акаунту — **Proposed**, чекає на рішення         | [ADR-0005](docs/adr/0005-what-account-deletion-erases.md)            |
| Продукти поглинають інгредієнти; фільтри комбінуються по-різному в групах  | [ADR-0006](docs/adr/0006-products-absorb-ingredients.md)             |
| Добові норми — Mifflin-St Jeor; вода й кроки **чекають на підпис**         | [ADR-0007](docs/adr/0007-daily-norm-formulas.md)                     |

Додатково, поза ADR:

- База одна на обидва сервіси, через `packages/database` (`@dns/database`).
- Email — Resend; без `RESEND_API_KEY` вмикається stub-клієнт, що пише лист
  у лог. `OTP_DEV_CODE` фіксує код для локальної розробки.
- Патерни портуються з `D:\PhpstormProjects\11am-app` —
  `apps/mobile-api/CLAUDE.md` і `apps/mobile-api/.claude/skills/`.

### Словник шляхів клієнтського API

Вирішено 2026-09-06, зафіксовано в
[ADR-0004](docs/adr/0004-client-api-url-conventions.md): шляхи виводяться за
REST-конвенціями, а не успадковуються з V1. Ключове — колекції в множині,
синглтон поточного користувача це `/profile` (колекції `/users` у клієнтському
API немає), часткова зміна через один `PATCH` із частковим тілом, булевий стан
через `PUT`/`DELETE` підресурсу замість `toggle`, фільтри в query.

Виведена карта шляхів на всі домени —
[`.claude/knowledge/client-api-routes.md`](.claude/knowledge/client-api-routes.md).
Остаточний контракт кожного домену фіксує його `plan.md`.

`.claude/knowledge/**` (V1 на Supabase) лишається довідником **доменної
моделі** — таблиці, поля, енуми, формули — і не є контрактом URL.

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

### Зріз 2 — client auth ✅

| Коміт                                                                   | Що                                                                                      |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `feat(database): users, refresh tokens, otp codes and oauth identities` | 5 таблиць + міграція `0000_thin_iceman.sql`, сутності, репозиторії                      |
| `feat(validation): auth schemas`                                        | `@dns/validation` з нуля; `AUTH_POLICY` у `@dns/constants`; 7 тестів                    |
| `fix(validation): otp pattern matched any six characters`               | регулярка приймала `dddddd` — бекслеш загубився при написанні файлу                     |
| `feat(client-api): sign-up with email verification code`                | register / verify-email / resend-code, `TokenService`, JWT-стратегія і guard            |
| `feat(client-api): sign-in with generic auth errors`                    | login, `GET /auth/me`                                                                   |
| `feat(client-api): refresh rotation, logout and logout everywhere`      | ротація ланцюжків, виявлення повтору                                                    |
| `feat(client-api): password reset with single-use permit`               | request → verify → complete                                                             |
| `feat(client-api): apple and google sign-in with create-or-link`        | `oauth/` в `api-infrastructure`, `OAuthSignInService`                                   |
| `fix(database): close the postgres pool on shutdown`                    | пул не закривався: тести не виходили, контейнер ігнорував SIGTERM                       |
| `test(client-api): auth flow specs against a real database`             | ts-jest + 3 db-специфікації, 17 тестів                                                  |
| `docs: plans for client auth and status sync`                           | 4 × `plan.md`, специфікації → `Implemented`, `.claude/knowledge/auth/client-auth-v2.md` |

**11 ендпоінтів** під `/api/v1/auth`: `register`, `verify-email`,
`resend-code`, `login`, `oauth`, `refresh`, `logout`, `logout-all`, `me`,
`password-reset/{request,verify,complete}`.

Дві речі, знайдені під час роботи і виправлені окремими комітами:

- **Permit-токен проходив би як access-токен.** `JwtStrategy` завантажувала
  користувача за `sub` і не дивилась на призначення токена, тож той, хто знає
  код відновлення, отримував би сесію — рівно те, що password-reset FR-009
  забороняє. Тепер у кожного токена явний claim `type`, який перевіряє кожен
  споживач, а permit підписано іншим ключем.
- **Ротація в 11am видаляє всі токени користувача**, тобто подовження на
  телефоні розлогінює планшет. Це суперечить session FR-006, тож у нас
  ротація торкається лише свого ланцюжка, а повтор спожитого токена вбиває
  один пристрій.

### Зріз 3 — client user ✅

| Коміт                                                                 | Що                                                                                                            |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `feat(database): profiles, settings, reminders and deletion requests` | 4 таблиці + міграція `0001_mighty_corsair.sql`; `UserRepository.createAccount` заповнює їх однією транзакцією |
| `feat(client-api): profile and app settings`                          | `GET`/`PATCH /profile`, `PATCH /profile/settings`                                                             |
| `feat(client-api): meal and weigh-in reminders`                       | `GET`/`PUT /profile/reminders`                                                                                |
| `feat(client-api): account deletion with a grace period`              | `POST`/`DELETE /profile/deletion-request`, `deletionScheduledFor` у `/auth/me`                                |
| `test(client-api): user domain specs`                                 | 13 db-тестів                                                                                                  |
| `docs: plans for client user and status sync`                         | 5 × `plan.md`, статуси специфікацій, карта шляхів                                                             |

**8 нових ендпоінтів** під `/profile`. Реєстрація тепер провізіонує акаунт
цілком: профіль, налаштування і пʼять нагадувань в одній транзакції з
`users` — і для реєстрації паролем, і для входу через провайдера.

Три рішення, які варто знати:

- **Профіль і налаштування — окремі таблиці, не ширші `users`.** `JwtStrategy`
  читає `users` на кожен авторизований запит, і цей рядок має лишатися вузьким.
- **Запит на видалення не обриває сесію.** Відновлення — авторизований виклик,
  тож інакше користувач опинився б на екрані відновлення без змоги ним
  скористатися.
- **`GET /profile/settings` навмисно немає.** Налаштування приходять вкладеними
  в `GET /profile`; два шляхи читання тих самих даних розходяться першими.

Специфікації `profile`, `profile-edit` і `account-deletion` мають статус
`Approved`, а не `Implemented` — у кожній лишилась частина, заблокована іншим
доменом; що саме, написано в розділі «Що ще не побудовано» їхніх `plan.md`.

---

### Зріз 4 — сховище файлів ✅

| Коміт                                                                              | Що                                                                 |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `feat(api-infrastructure): s3 storage with presigned uploads and ownership checks` | `StorageModule`, `validateOwnership`, 8 тестів                     |
| `feat(client-api): presigned uploads and profile photo`                            | `POST /uploads`, `photoUrl` у `PATCH /profile`                     |
| `feat(client-api): support tickets with attachments`                               | `POST /profile/feedback`, таблиця `feedback`                       |
| `fix(client-api): ownership checks must reject, not throw synchronously`           | метод типізовано як `Promise`, а кидав синхронно — тест це знайшов |
| `docs: deletion must clear support reply addresses explicitly`                     | знайдена й закрита прогалина приватності                           |

Байти йдуть **повз API** — клієнт бере підписаний дозвіл і вивантажує напряму
в сховище. Перевірено наскрізно на MinIO: presign → PUT → GET, байти
ідентичні.

Дві речі, які виявилися лише під час перевірки:

- **Розмір вшивається в підпис.** Оголосив 1024, вивантажив 160 — MinIO віддає
  непрозорий 403. Клієнт мусить називати точний розмір; зафіксовано в
  `apps/client-api/CLAUDE.md`.
- **`ON DELETE SET NULL` не чистить email.** Тікет переживає видалення автора
  (як і задумано ADR-0005), але `reply_email` лишався з особистою адресою.
  Відтворено, виправлено кроком у runbook, покрито тестом.

### Зріз 5 — client nutrition ✅

| Коміт                                                                         | Що                                              |
| ----------------------------------------------------------------------------- | ----------------------------------------------- |
| `docs(adr): products absorb ingredients, filter combination semantics`        | ADR-0006                                        |
| `feat(database): nutrition goals, meal, water and step logs`                  | 4 таблиці + міграція `0003_dry_lady_ursula.sql` |
| `feat(validation): nutrition goal, meal, water and step schemas`              | 11 тестів                                       |
| `feat(client-api): nutrition goal, daily slice, meal, water and step logging` | 8 ендпоінтів                                    |
| `test(client-api): nutrition domain specs`                                    | 14 db-тестів                                    |
| `docs: plans for client nutrition and status sync`                            | 3 × `plan.md`                                   |

Три рішення, які варто знати:

- **Денний підсумок не зберігається, а рахується запитом.** V1 тримав
  матеріалізовану `daily_nutrition_summary`, яку мав наповнювати тригер —
  тригер так і не написали, і таблиця назавжди показувала нулі.
- **Записаний прийом їжі — зліпок, а не посилання.** Рецепт можна
  відредагувати, а чек має лишатися чеком. Це ж рішення дозволило зробити
  домен **до** появи каталогу рецептів: `recipe_id` nullable і поки без FK.
- **Вода — журнал, кроки — одне значення.** Дзеркально і навмисно: склянку
  треба вміти забрати, а кроки приходять уже підсумованими, і додавання
  подвоїло б їх на другій синхронізації за день.

### Зріз 6 — client onboarding ✅

| Коміт                                                                          | Що                                                                                     |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `feat(constants): daily norm formulas from the questionnaire`                  | ADR-0007 + чисті функції, 13 тестів                                                    |
| `feat(database): questionnaire fields on profiles and recommendation snapshot` | 9 колонок на `profiles`, 3 на `nutrition_goals`, міграція `0004_overjoyed_gateway.sql` |
| `feat(client-api): onboarding questionnaire and daily recommendations`         | 4 ендпоінти під `/profile`                                                             |
| `test(client-api): onboarding questionnaire specs`                             | 12 db-тестів                                                                           |
| `docs: plan for onboarding and status sync`                                    | `plan.md`, статус специфікації                                                         |

Три речі варті уваги:

- **Формула була відкритим питанням, і я його закрив, а не обійшов.**
  Специфікація прямо каже, що жодна норма не рахується на клієнті, тож без
  формули екрани 14–16 показували б однакову константу для 50-кілограмової
  жінки і 110-кілограмового чоловіка. Взяв Mifflin-St Jeor — але статус
  ADR-0007 `Proposed`, бо норми води й кроків я вибрав інженерно, а не як
  фахівець.
- **Завершення анкети пише і прапорець, і ціль харчування — однією дією.**
  Кроки 14–16 і є екраном цілі в іншому вбранні; акаунт, позначений
  завершеним, але без цілі, викинув би людину на трекінг без кілець.
- **Рекомендація зберігається зліпком поруч із вибором.** Специфікація
  вимагає бачити, наскільки користувач відхилився, а свіжа рекомендація
  зсувається разом із вагою — без зліпка порівнювати було б із рухомою
  мішенню.

Рекомендація повертає `null`, доки анкета не зібрала все потрібне. Не
дефолти: норма, порахована з вигаданої ваги, виглядає так само авторитетно,
як справжня.

### Зріз 7 — client progress ✅

| Коміт                                                                         | Що                                                        |
| ----------------------------------------------------------------------------- | --------------------------------------------------------- |
| `feat(database): body measurements for weight, waist and height`              | таблиця + репозиторій, міграція `0005_ambiguous_blob.sql` |
| `feat(validation): progress window and measurement schemas`                   | вікно `?days=`, показник у шляху, вимір                   |
| `feat(client-api): progress metrics overview, detail and measurement logging` | 4 ендпоінти під `/progress`                               |
| `feat(client-api): patch a single nutrition target instead of the whole goal` | `PATCH /nutrition/goal`                                   |
| `feat(client-api): target weight is editable from the profile`                | `targetWeightKg` у `PATCH /profile`                       |
| `test(client-api): progress db specs and partial goal edits`                  | 19 + 2 db-тести                                           |
| `docs: plans for client progress and status sync`                             | 3 × `plan.md`, статуси, карта шляхів                      |

Три речі варті уваги:

- **Половина домену не має власного сховища.** З шести показників екрана
  калорії, вода і кроки вже належать `nutrition` — прогрес їх читає. Своя
  таблиця на всі шість дала б одному числу два джерела, і перший же розбіг
  між денним екраном і графіком нікому не вдалося б пояснити. Нових таблиць
  тут одна: `body_measurements` на вагу, талію і зріст.
- **Читати можна девʼять показників, писати — три.** Калорії, воду і кроки
  пишуть через `/nutrition`, де день є частиною шляху. Другий шлях запису в
  те саме число дозволив би логу і графіку розійтися, і сказати, який із них
  правий, було б нічим.
- **Цілі лишились у доменів, які ними володіють.** Карта шляхів передбачала
  `PUT /progress/metrics/{metric}/goal` — я його не побудував: щоденні цілі
  міняє `PATCH /nutrition/goal`, цільову вагу — `PATCH /profile`. Фасад під
  `/progress` дав би одній колонці двох власників. `PATCH` до цілі свідомо
  не створює її: народити ціль із одного поля означало б вигадати шість
  інших.

Запис ваги і зросту додатково оновлює профіль — інакше «оновлена норма» після
зважування рахувалася б із ваги, яку людина замінила тижні тому.

---

## Далі

### Поза цим планом

Наступні кандидати:

- **`client/recipe` + `product`** — найбільший домен, і рішення для нього вже
  ухвалені (ADR-0006). Розблокує логування їжі з каталогу, фільтри, пошук і
  власні страви. Але тримає **11 відкритих питань** зі специфікацій — див.
  розділ нижче.
- **`client/meal-plan`** — розблокує слоти раціону на головному екрані
  (daily-tracking FR-006).
- Далі: `shopping-list`, `subscription`, `notifications`, потім
  admin-зрізи (їм спершу потрібні специфікації: у `docs/specs/admin/` зараз
  лише README).

Підключення мобілки до живого API — окремий трек.

---

## Свідомі відхилення від плану

- **`@dns/utils` не створено.** У плані був, але жодного спільного хелпера
  ще не знадобилось — створимо разом із першим, а не наперед.
- **Домен рецептів має 11 відкритих питань, які треба закрити до коду.**
  Найважчі: чи має рецепт одну кухню чи кілька; де рахується КБЖВ власної
  страви (сервер, за ADR-0006 — але формула й округлення не задані); чи
  застосовуються фільтри до вкладок «Улюблені» і «Власні»; чи потрібна
  модерація фото користувацьких страв; чи можна редагувати каталожні рецепти.
  Повний перелік — у специфікаціях `docs/specs/client/recipe/*`, позначені
  `[NEEDS CLARIFICATION]`.
- **Адмінка ще не знає про ADR-0006.** `GET /admin/recipes/ingredients/all` має
  стати запитом до продуктів, а редактор складу — вибором продукту. Правка в
  `apps/web`, не лише в API; робиться разом з admin-зрізом.
- **OAuth-верифікацію не перевірено проти живих Apple/Google.** Токен провайдера
  неможливо видобути в тесті, тож у db-специфікаціях підмінено рівно цей крок
  (`FakeOAuthVerifier`), а вся логіка create-or-link виконується по-справжньому.
  Перед релізом потрібен ручний прогін із реальним пристроєм і заповненими
  `GOOGLE_CLIENT_ID` / `APPLE_CLIENT_ID`.
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

- **Видалення акаунту нічого не видаляє — потрібне рішення.** Запит і
  скасування працюють, завдання-прибиральник — ні, і причина не в обсязі
  роботи: спершу треба ухвалити
  [ADR-0005](docs/adr/0005-what-account-deletion-erases.md) (`Proposed`), бо він
  упирається в строки зберігання фінансових записів. Проміжна ручна процедура є
  і відпрацьована на локальній базі:
  [`execute-overdue-account-deletions`](docs/runbooks/execute-overdue-account-deletions.md),
  запускати щотижня. Сигналу від моніторингу немає — тихе накопичення
  невиконаних запитів на видалення нічим себе не виявляє, а це юридична
  проблема.
- **Прострочені рядки ніхто не прибирає.** `refresh_tokens` зберігає й спожиті
  токени (це і робить крадіжку помітною), `otp_codes` і
  `password_reset_permits` лишаються після закінчення строку. Потрібне
  періодичне прибирання — cron або runbook.
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

## Пастки середовища

- **Windows: `curl -d` у Git Bash псує кирилицю на `?` ще до відправки.**
  Виглядає точно як баг сервера — знаки питання приходять у відповіді й лежать
  у базі. Для тіл із не-ASCII писати JSON у файл і слати `--data-binary @file`.
  Те саме з `psql` у консолі Windows: у виводі `?`, хоча в базі коректно —
  перевіряти через `length()` або кодпоінти. Розгорнуто в
  [`apps/client-api/CLAUDE.md`](apps/client-api/CLAUDE.md).
- Той самий ефект псує heredoc-скрипти з кирилицею й тире у цій же консолі —
  довгі україномовні файли надійніше писати редактором, а не через `cat <<EOF`.

## Як перевірити локально

```bash
docker compose up -d           # postgres:16, redis:7, minio + бакет
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm typecheck                 # 10 воркспейсів — зелено
pnpm dev:client-api            # :3000, Swagger /docs
pnpm dev:admin-api             # :3001, Swagger /docs
```

Тести:

| Команда                                      | Що                                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------------ |
| `pnpm --filter @dns/constants test`          | 16 — Atwater, Mifflin-St Jeor, добові норми і БЖВ                                    |
| `pnpm --filter @dns/validation test`         | 25 — пароль, email, код, налаштування, нагадування, цілі й записи харчування         |
| `pnpm --filter @dns/api-common test`         | 4 — форма `ApiError`, 500 без витоку                                                 |
| `pnpm --filter @dns/api-infrastructure test` | 11 — коди та перевірка власності файлів                                              |
| `pnpm --filter @dns/client-api test:db`      | 81 — auth, user, звернення, nutrition, анкета і прогрес на живій базі (треба docker) |

Наскрізний прогін auth (перевірено вручну, `OTP_DEV_CODE=000000`):

| Крок                                   | Результат                                                        |
| -------------------------------------- | ---------------------------------------------------------------- |
| `POST /auth/register`                  | 201, код у логах stub-клієнта                                    |
| `POST /auth/verify-email`              | 200, пара токенів                                                |
| `GET /auth/me` з Bearer                | 200 з id/email/emailVerifiedAt                                   |
| `GET /auth/me` без токена              | 401                                                              |
| `POST /auth/refresh`                   | 200, нова пара                                                   |
| повтор старого refresh                 | 401 — і виданий між ними токен теж мертвий (ланцюжок відкликано) |
| невалідне тіло                         | 422 з `errors[{path,message}]`                                   |
| permit на `/auth/me` і `/auth/refresh` | 401 в обох випадках                                              |

`docker compose` цього разу піднімався: міграція застосована, 5 таблиць у
базі, db-тести проходять.
