---
spec: ./spec.md
status: Implemented
owner: '@amelin0'
created: 2026-09-08
updated: 2026-09-08
related-adrs: [ADR-0002, ADR-0004, ADR-0005]
related-runbooks: []
---

# Plan: Support inbox (Звернення в підтримку)

## Summary

Читання й рух наявної таблиці `feedback` (FR-001…FR-007), плюс одна нова
таблиця під внутрішні нотатки (FR-008…FR-010) і одне нове значення стану.

Рішення власника продукту від 2026-09-08:

| Питання | Рішення |
|---|---|
| Відповідь із панелі | **Ні** — статуси; email показано й копіюється |
| Внутрішні нотатки | **Журнал**: хто, коли, що |
| Стани | Три наявні **плюс «відхилено»** |

## Database

### Зміна: `feedback_status` + `rejected`

`ALTER TYPE ... ADD VALUE 'rejected'`. Без нього спам довелося б «розв'язувати»
— і лічильник розв'язаних перестав би щось означати (spec, Edge Cases).

⚠️ Нове значення enum **не можна використати в тій самій транзакції**, у якій
його додано. Тут це нікому не заважає: міграція лише додає значення й
створює таблицю, жодного `UPDATE` на `'rejected'` у ній немає — перевірено
на postgres 16, застосовується одним файлом.

### Нова таблиця: `feedback_notes`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK, default random |
| `feedback_id` | `uuid` | NOT NULL → `feedback.id` ON DELETE CASCADE |
| `author_id` | `uuid` | → `admins.id` ON DELETE SET NULL |
| `author_name` | `text` | NOT NULL |
| `body` | `text` | NOT NULL |
| `created_at` | `timestamptz` | NOT NULL, default now |

Індекс: `(feedback_id, created_at)` — єдиний спосіб, яким їх читають.

**`author_name` дублює ім'я з `admins` навмисно** (FR-010). `author_id`
обнуляється разом зі звільненим співробітником, і без копії імені нотатка
перетворилася б на анонімний запис — тобто журнал втрачав би саме те, заради
чого він журнал. Це знімок на момент запису, а не денормалізація для
швидкості: перейменування співробітника не переписує старі нотатки, і так
і має бути.

Нотатки **append-only**: ані `PUT`, ані `DELETE`. Журнал, який можна
переписати, — це вже не журнал (spec, Out of Scope).

### Migrations

- `0016_*.sql` — `ALTER TYPE feedback_status ADD VALUE 'rejected'` і
  `feedback_notes`.

## API contract

Базовий шлях `/api/v1`, конверт `{data}`, camelCase (ADR-0002/0004). Усі
маршрути під Bearer + ADMIN/SUPER_ADMIN (FR-012).

Ресурс названо `feedback`, як таблиця і як клієнтський `POST
/profile/feedback`: третя назва для тієї самої сутності («support-messages»
у V1-панелі) створювала б різницю там, де її немає.

### `GET /api/v1/feedback`

Query: `status`, `type`, `search`, `page`, `limit`. Порядок — найновіші
зверху (FR-001).

```json
{ "id": "…", "type": "not_working", "status": "new",
  "description": "Не приходить код…", "imageCount": 2,
  "replyEmail": "someone@example.com",
  "author": { "id": "…", "email": "someone@example.com", "isBlocked": false },
  "createdAt": "…" }
```

`author` — `null`, коли `user_id` порожній: автор видалив акаунт, і
ADR-0005 обирає знеособлення, а не видалення звернення (FR-005).

**Лічильника нових окремим ендпоінтом немає** (FR-007): `status=new` з
`limit=1` повертає `meta.total`. Той самий підхід, що з простроченими
запитами на видалення, і з тієї ж причини — друге джерело однієї цифри
розходиться з фільтром.

### `GET /api/v1/feedback/:id`

Те саме плюс `imageUrls`, `context` (те, що надіслав застосунок) і `notes`:

```json
{ "notes": [ { "id": "…", "authorName": "Олег", "body": "Відтворюється на 1.2",
               "createdAt": "…" } ] }
```

### `PATCH /api/v1/feedback/:id/status`

`{ "status": "in_progress" }` → `204`. Будь-який стан у будь-який бік:
черга, з якої не можна відкотити помилковий клік, змушує заводити другий
запис про те саме.

### `POST /api/v1/feedback/:id/notes`

`{ "body": "…" }` → `201` з нотаткою. Автор береться **з токена**, не з
тіла: інакше журнал підписував би себе сам.

## Environment variables

Нових немає. `RESEND_API_KEY` тут не потрібен — з цього екрана нічого не
надсилається (FR-011).

## File structure

```
packages/database/src/schema/feedback.schema.ts          # + feedback_notes
packages/database/src/migrations/0016_*.sql
packages/database/src/repositories/admin-feedback/

packages/shared-types/src/feedback.ts                    # + Rejected
packages/validation/src/admin-feedback.schemas.ts

apps/admin-api/src/modules/support/
  support.controller.ts  support.service.ts  support.module.ts
  support.errors.ts  dto/

apps/web/src/data/remote/domains/support/
apps/web/src/state/domains/support/
apps/web/src/view/support/
```

## Security & edge cases

- **Усі маршрути за роллю** (FR-012).
- **Нічого не йде користувачеві** (FR-011): у модулі немає ані поштового
  клієнта, ані сервісу сповіщень — не як домовленість, а як відсутня
  залежність.
- **Автор невідомий** — `author: null`, і картка це показує словами, а не
  порожнім місцем.
- **Мертвий URL вкладення** — картка показує решту; зображення, що не
  завантажилось, не ламає екран.
- **Нотатка переживає автора** — `author_name` копіюється в рядок.
- **`search` іде по тексту звернення й `reply_email`** — не по нотатках:
  внутрішній запис не має витягувати чуже звернення в чужий пошук.

## Rollout

- Feature flag: немає.
- Порядок: міграція → деплой admin-api → публікація панелі.
- Клієнтський API не змінюється взагалі.

## Verification

- DB-тести: список і фільтри; зміна стану; `status=new` не рахує рухнуті;
  нотатка зберігає автора й час; нотатка переживає видалення акаунта
  співробітника; звернення без автора віддається цілим.
- Тест на порядок: найновіше звернення першим.
- Смоук: надіслати звернення із застосунку, побачити його в інбоксі.

## Related

- Spec: [./spec.md](./spec.md)
- ADRs: [ADR-0005](../../../../adr/0005-what-account-deletion-erases.md)
- Сусідній зріз: [`admin/users/directory`](../../users/directory/plan.md)
