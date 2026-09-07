---
id: ADR-0001
title: Бекенд — модульний моноліт на NestJS + Drizzle, а не продовження Supabase
status: Accepted
date: 2026-09-06
deciders: ['@amelin0']
---

# ADR-0001: Бекенд — модульний моноліт на NestJS + Drizzle, а не продовження Supabase

## Context

V1 працював на Supabase: `auth.users` + тригер `handle_new_user()`, який
наповнював `profiles`, бізнес-логіка в Edge Functions, доступ до даних —
через `supabaseAdmin`. Цей контракт зафіксовано в `.claude/knowledge/`
(auth, user, nutrition, recipe, product, shopping-list, meal-plan) і він
лишається довідником **доменної моделі**: таблиці, поля, енуми, формули
(`калорії = Б×4 + В×4 + Ж×9`), правила агрегації списку покупок.

Самого коду бекенду в монорепо немає — `apps/api/` і `packages/` містять
лише `.gitkeep`. Натомість уже прийнято низку рішень, які Supabase не
передбачає:

- `docker-compose.yml` піднімає власні `postgres:16`, `redis:7` і MinIO
  з ініціалізацією бакета через `scripts/minio-init.sh`;
- `.env.example` описує `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET` +
  `JWT_REFRESH_SECRET` з `JWT_EXPIRES_IN=15m`, і повний набір `S3_*`
  (endpoint, публічний URL, TTL підписаних посилань, ліміт розміру,
  білий список MIME);
- root `package.json` уже оголошує `db:generate`, `db:migrate`,
  `db:studio`, `db:seed` з делегуванням у `@dns/database` — це дієслова
  `drizzle-kit`, а не Supabase CLI;
- `packages/CLAUDE.md` описує майбутній розкол на `@dns/shared-types`,
  `@dns/validation`, `@dns/constants`, `@dns/utils`, `@dns/database`,
  `@dns/api-common`, `@dns/api-infrastructure`.

Тобто інфраструктура вже спроєктована під самостійний Node-бекенд; бракує
лише фіксації самого рішення й вибору фреймворка та ORM.

Поруч є працюючий референс — монорепо `11am-app` тієї ж команди: NestJS 11,
Drizzle, `nestjs-zod`, `passport-jwt`, сім shared-пакетів і набір skills
(`architecture`, `modules`, `database`, `repository`, `dto-view`,
`validation`, `error-handling`, `naming-conventions`), які описують шари
рядок за рядком. `.env.example` нашого репозиторію дослівно збігається зі
`storage.config.ts` з 11am — інфраструктурний шар від початку планувався
як порт звідти.

## Decision

Бекенд — **модульний моноліт на NestJS 11 з DDD-lite**: доменні модулі
поверх централізованого шару даних на **Drizzle ORM**, валідація через
**`nestjs-zod`** зі схемами, спільними з клієнтами.

Ланцюг шарів фіксований і однаковий для кожного домену:

```
Controller → Service → Repository (extends BaseRepository) → Entity → Schema
```

Сутності створюються лише через `static from(row)` з приватним
конструктором; репозиторії повертають Entity, ніколи сирі рядки; inbound
DTO — `createZodDto(schema)` зі схеми в `@dns/validation`; outbound —
`{Name}View implements {Name}OutboundDto` зі `static from(entity)`.
Схема БД, сутності, репозиторії, міграції та сіди живуть у
`packages/database` і споживаються обома сервісами як `@dns/database`.

Вибір Drizzle, а не Prisma, тримається на трьох речах: скрипти в root
`package.json` уже написані під `drizzle-kit`; міграції — це звичайний
SQL у репозиторії, який можна прочитати й виправити руками; і `drizzle-kit
check` + `generate` у CI ловлять розходження схеми з міграціями як
провалений PR, а не як сюрприз на деплої.

Вибір `nestjs-zod`, а не `class-validator`, дає одну схему на обидва боки
дроту: `@dns/validation` валідує тіло запиту на бекенді й ту саму форму
на мобілці, тож правила не розповзаються.

## Consequences

- ✅ Клієнти отримують типи й схеми з тих самих пакетів, що й бекенд, —
  контракт не дублюється в трьох місцях і не розсинхронізовується.
- ✅ Патерни не треба винаходити: skills і код 11am дають готові
  відповіді на «як виглядає модуль», «де живе guard», «як формується
  сторінкована відповідь».
- ✅ Повний контроль над SQL, індексами та міграціями; дані більше не
  замкнені на постачальника.
- ⚠️ Зникає все, що Supabase давав безкоштовно: RLS, Storage, готова
  автентифікація з OAuth і листами. Кожну з цих речей тепер пишемо самі —
  автентифікація стає першим і найбільшим зрізом роботи.
- ⚠️ `.claude/knowledge/**` перестає описувати чинний код. Це довідник
  доменної моделі, а не контракт API; після кожного зрізу його треба
  оновлювати вручну — правило вже записане в `docs/CLAUDE.md`.
- 💸 З'являється власна експлуатація: міграції, бекапи, ротація секретів,
  моніторинг. Частину покриють runbooks у `docs/runbooks/`.
- 💸 Drizzle не приховує SQL — поріг входу вищий за Prisma, і N+1
  доводиться помічати самому, а не отримувати попередження від ORM.

## Alternatives considered

- **Лишитися на Supabase + Edge Functions** — відхилено: інфраструктура
  вже перевезена на власні Postgres/Redis/MinIO, а специфікації V2
  (онбординг з серверними формулами BMR/TDEE, прогрес, підписка з
  валідацією чеків, нотифікації) вимагають логіки, яку в Edge Functions
  довелося б розмазати тонким шаром без спільного шару даних.
- **Prisma замість Drizzle** — відхилено: розходиться зі скриптами, що
  вже в `package.json`, ховає SQL за власним DSL і не має еквівалента
  перевірки дрейфу схеми, на якій тримається CI у 11am.
- **Fastify/Express без фреймворка** — відхилено: DI, guard'и,
  інтерсептори й Swagger довелося б збирати руками, а всі патерни
  референсу стали б неперенесеними.
- **`class-validator` + `class-transformer`** — відхилено: змушує
  описувати одні й ті самі правила окремо для бекенду й для форм у
  мобілці.

## Specs that reference this ADR

- _(populated as specs cite this ADR)_

## Links

- Related ADRs: ADR-0002, ADR-0003
- Референс: `D:\PhpstormProjects\11am-app` — `apps/mobile-api/CLAUDE.md`,
  `apps/mobile-api/.claude/skills/`
- Доменна модель V1: `.claude/knowledge/`
