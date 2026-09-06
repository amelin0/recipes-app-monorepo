# @dns/client-api

NestJS 11 API для мобільного застосунку RationFit. Слухає **:3000**, префікс
`api/v1`, Swagger на `/docs`. Адмінська поверхня — окремий сервіс
`apps/admin-api` на :3001 ([ADR-0002](../../docs/adr/0002-split-client-and-admin-api.md)).

## Структура

```
src/
├── main.ts                 # префікс, глобальні pipe/filter/interceptor, Swagger, shutdown hooks
├── app.module.ts           # конфіги, логер, throttler, БД, інфраструктура, доменні модулі
├── common/config/          # типізовані конфіги: app|auth|database|email|oauth|otp|throttler
└── modules/
    ├── auth/               # реєстрація, вхід, OAuth, токени, відновлення паролю
    ├── user/               # /profile, налаштування, нагадування, видалення акаунту
    └── health/             # GET /health
```

Шар даних — не тут: схема, сутності й репозиторії живуть у `@dns/database`,
крос-катні речі (фільтр винятків, конверт відповіді, throttler, логер) — у
`@dns/api-common`, адаптери зовнішніх сервісів — у `@dns/api-infrastructure`.

## Ланцюг шарів

```
Controller → Service → Repository (@dns/database) → Entity → Schema
```

- **Контролер** не містить логіки: розбирає запит, кличе сервіс, мапить у View.
- **Сервіс** тримає правила домену і не знає про HTTP далі за винятки Nest.
- **Репозиторій** повертає Entity, ніколи сирі рядки.
- **Entity** створюється лише через `static from(row)`, конструктор приватний.

## Іменування

| Що            | Патерн                                            | Приклад                     |
| ------------- | ------------------------------------------------- | --------------------------- |
| Inbound DTO   | `{Action}InboundDto extends createZodDto(schema)` | `RegisterInboundDto`        |
| Outbound view | `{Name}View` зі `static from(entity)`             | `ProfileView`               |
| Коди помилок  | `{Domain}ErrorCode` у `<module>.errors.ts`        | `AuthErrorCode.InvalidCode` |

Схеми валідації живуть у `@dns/validation`, не в застосунку: мобільний
застосунок переюзає їх у формах, тож правило «порожнє імʼя» означає те саме на
обох боках.

## Правила, які легко порушити ненавмисно

- **Кожен токен несе явний claim `type`** (`access` | `refresh` |
  `password-reset`), і кожен споживач його перевіряє. Прибрати перевірку —
  значить дозволити permit-у відновлення паролю відкрити сесію
  ([ADR-0003](../../docs/adr/0003-auth-model-tokens-and-admin-permissions.md)).
- **Продуктова політика — в `@dns/constants`, ліміти запитів — в env.**
  «Скільки спроб дозволяє код» це рішення; «як часто можна смикати ендпоінт» —
  налаштування середовища.
- **`no-console` увімкнено як помилка.** Єдиний санкціонований вивід —
  pino-логер: `console.log` доїжджає в сховище логів нерозбірним рядком.
- **Шляхи виводяться за правилами**
  [ADR-0004](../../docs/adr/0004-client-api-url-conventions.md), а не
  вигадуються: колекції в множині, `/profile` як синглтон, часткова зміна —
  один `PATCH`, булевий стан — `PUT`/`DELETE` підресурсу замість `toggle`.

## Команди

```bash
pnpm dev              # nest start --watch
pnpm build            # webpack-збірка у плаский dist/main.js
pnpm start:prod       # node dist/main
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint src/ і test/
pnpm test:db          # jest проти живої бази — потрібен docker compose
```

Збірка йде через **webpack**, а не голий tsc: `paths` вказують на
`packages/<pkg>/src` поза текою застосунку, і tsc через це виносить точку входу
в `dist/apps/client-api/src/main.js`. Webpack бандлить workspace-пакети, решту
`node_modules` лишає зовнішньою і дає плаский `dist/main.js`.

## Тести

`test/*.db-spec.ts` — проти справжнього Postgres, окремий конфіг
`jest.db.config.ts`, запуск `pnpm test:db`. Навмисно не в `pnpm typecheck` /
`pnpm lint`: ті мають лишатися придатними до запуску з чистого клону.

ts-jest, а не tsx: NestJS резолвить залежності конструктора з
`design:paramtypes`, який видає лише TypeScript-емісія з
`emitDecoratorMetadata`. Раннери на esbuild його втрачають, і кожен провайдер
падає на створенні.

Верифікацію провайдера OAuth підмінено (`FakeOAuthVerifier` у
`test/support/`) — токен Apple/Google у тесті не видобути. Усе після перевірки
токена виконується по-справжньому.

## Локальна перевірка руками

```bash
docker compose up -d
pnpm db:migrate
pnpm dev
```

`OTP_DEV_CODE=000000` у `.env` фіксує код підтвердження, а порожній
`RESEND_API_KEY` вмикає stub-клієнт, який пише лист у лог замість надсилання —
тож увесь auth-флоу проходиться локально без поштового провайдера.

> **Пастка на Windows.** `curl -d '{"name":"Олег"}'` у Git Bash псує кирилицю
> на `?` **ще до відправки** — це робить консоль, а не API. Виглядає точно як
> баг сервера: у відповіді приходять знаки питання, і в базі теж вони.
>
> Для будь-якого тіла з не-ASCII писати JSON у файл і слати його байтами:
>
> ```bash
> python -c "import io,json; io.open('body.json','w',encoding='utf-8').write(json.dumps({'name':'Олег Чередник'}, ensure_ascii=False))"
> curl -X PATCH localhost:3000/api/v1/profile -H "Authorization: Bearer $TOKEN" \
>      -H 'Content-Type: application/json' --data-binary @body.json
> ```
>
> Той самий ефект дає `psql` у консолі Windows: кирилиця у виводі показується
> як `?`, хоча в базі лежить коректно. Перевіряти через `length(name)` або
> кодпоінти, а не очима.

## Довідка

- Реалізовані маршрути й коди помилок: [`.claude/knowledge/client-api-routes.md`](../../.claude/knowledge/client-api-routes.md)
- Auth у деталях: [`.claude/knowledge/auth/client-auth-v2.md`](../../.claude/knowledge/auth/client-auth-v2.md)
- Специфікації і плани: [`docs/specs/client/`](../../docs/specs/client)
- Рішення: [`docs/adr/`](../../docs/adr)
