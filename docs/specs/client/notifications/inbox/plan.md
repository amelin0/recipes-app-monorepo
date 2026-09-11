---
spec: ./spec.md
status: Implemented
owner: '@amelin0'
created: 2026-09-07
updated: 2026-09-11
related-adrs: [ADR-0004, ADR-0008]
related-runbooks: []
---

# Plan: Inbox (Сповіщення)

## Summary

FR-001…FR-006 — серверна частина: одна таблиця `notifications` і чотири
маршрути. Групування за днями, обрізання тексту і порожній стан клієнтські.

Інбокс читає, а пишуть у нього продюсери —
[`../producers/plan.md`](../producers/plan.md): обидва API (підписка
активована, реферальний код використано, запит на видалення створено чи
скасовано, користувацький продукт підтверджено) і фоновий воркер
([ADR-0008](../../../../adr/0008-background-jobs.md): підписка закінчується
за три дні, підписка закінчилась). Клієнтський API сам сповіщень не створює —
лише читає й позначає.

## Database

### Нова таблиця `notifications`

| Column                        | Type                | Опис                                    |
| ----------------------------- | ------------------- | --------------------------------------- |
| `id`                          | `uuid`              | PK                                      |
| `user_id`                     | `uuid`              | FK `users`, ON DELETE CASCADE           |
| `type`                        | `notification_type` | `reminder` \| `system` \| `subscription`|
| `title`, `body`               | `text`              | NOT NULL                                |
| `subtitle`                    | `text`              | лише в повніших повідомленнях           |
| `items`                       | `jsonb`             | перелік пунктів (FR-005)                |
| `meta_label`                  | `text`              | «Розмір файлу: 42.5 MB»                 |
| `action_label`, `action_route`| `text`              | одна дія в підвалі картки               |
| `read_at`                     | `timestamptz`       | коли **вперше** відкрили                |
| `created_at`                  | `timestamptz`       |                                         |

Індекс `notifications_user_created_idx` на `(user_id, created_at)`.

**Текст зберігається, а не будується на читанні.** Сповіщення — це запис про
те, що вже надіслали; у випадку push формулювання пішло з будинку в мить
доставки. Відтворення з шаблона згодом дозволило б інбоксу і push-у казати
різне про ту саму подію.

Це ж вирішує мову: сповіщення написане тією, якою акаунт читав у момент
створення, і в ній лишається. Таблиці перекладів тут немає з тієї ж причини,
з якої її немає в чека.

**`items` — JSON, а не таблиця рядків.** Це частина повідомлення, а не дані,
які хтось запитує; таблиця, з якою ніколи не роблять join, — таблиця заради
таблиці.

**`read_at`, а не булеве `is_read`.** Час коштує стільки ж, а відповідає ще й
на «коли». Повторне відкриття його не переписує: це мить першого прочитання.

### Migrations

- `0010_calm_boomer.sql` — енум, таблиця, індекс (разом із таблицями FAQ).

## API contract

### `GET /notifications?unreadOnly=&page=&limit=`

**Auth:** `JwtGuard`

Найновіші перші, посторінково; відповідь — конверт `{ data, meta }`.

```json
{
    "data": [
        {
            "id": "…",
            "type": "system",
            "title": "Доступне оновлення системи",
            "body": "…",
            "subtitle": "Що нового",
            "items": ["Швидший пошук", "Виправлення"],
            "metaLabel": "Розмір файлу: 42.5 MB",
            "actionLabel": "Оновити",
            "actionRoute": "/settings/update",
            "isRead": false,
            "createdAt": "2026-09-07T08:12:00.000Z"
        }
    ],
    "meta": { "total": 12, "page": 1, "limit": 20, "totalPages": 1 }
}
```

**Список несе повідомлення цілком, і окремого маршруту деталі немає.**
Різниця між рядком і карткою — скільки з одного й того самого тексту кожен
малює (FR-002 і FR-005). Обрізання до двох рядків робить клієнт, бо лише він
знає свою ширину.

**Групування за днями — клієнтське.** До якого дня належить мітка часу,
залежить від часового поясу пристрою, і сервер його не знає — те саме
правило, за яким журнал харчування отримує дату від клієнта. Відкрите
питання специфікації закрито цим.

**`unreadOnly` — булеве, а не фільтр стану.** Табів рівно два (FR-003);
`?status=` запрошував би третій, якого ніхто не проєктував.

### `GET /notifications/unread-count`

`{ "data": { "count": 3 } }` — число на дзвіночку (FR-006).

**Окремий маршрут, бо головний екран показує дзвіночок, ніколи не
завантажуючи інбокс.** Класти це число в `meta` списку означало б змусити
головний екран тягнути сторінку сповіщень заради одного числа.

### `PUT /notifications/{id}/read`

**204**, ідемпотентно (FR-004). `404` `notifications.not-found` — і коли
сповіщення немає, і коли воно чуже.

### `POST /notifications/read-all`

**204.** Дієслово в шляху — той самий виняток ADR-0004, що й копіювання дня
плану: це одна дія над багатьма рядками, а не зміна стану одного ресурсу.

Прочитані сповіщення лишаються у списку; зникає лише бейдж.

## Environment variables

Власних не додає.

## File structure

```
apps/client-api/src/modules/notifications/notifications.controller.ts
apps/client-api/src/modules/notifications/notifications.service.ts
apps/client-api/src/modules/notifications/notifications.errors.ts
apps/client-api/src/modules/notifications/dto/
packages/database/src/schema/notifications.schema.ts
packages/database/src/entities/notification.entity.ts
packages/database/src/repositories/notification/
packages/validation/src/notifications.schemas.ts
```

## Shared contract

- `@dns/shared-types` — `NotificationType`.
- `@dns/validation` — `notificationListQuerySchema`, `notificationIdParamSchema`.

## Security & edge cases

- Читання і позначення обмежені власником у самому `WHERE`; чуже сповіщення
  дає 404, а не мовчазний no-op.
- Позначення вже прочитаного не помилка і не переписує `read_at`.
- `limit` має стелю: без неї один запит витяг би всю історію.
- Сповіщення без переліку віддає `items: []`, без дії — `null` в обох полях
  дії. Порожній рядок замість `null` змусив би клієнт відрізняти «немає
  кнопки» від «кнопка без напису».

## Verification

- `apps/client-api/test/notifications.db-spec.ts` — 11 тестів інбокса:
  порожній стан, порядок, повний вміст картки, порожні поля простого
  сповіщення, ізоляція між акаунтами, `meta.total` проти сторінки,
  прочитання і бейдж, повторне прочитання, чуже сповіщення, таб
  «Не прочитані», «Прочитати всі».

## Що ще не побудовано

- **Частина подій не має автора.** `promo`, `daily_log_reminder`,
  `water_reminder`, `inactivity`, `subscription_cancelled` оголошені в переліку
  подій, але їх ніхто не пише — див. [`../producers/plan.md`](../producers/plan.md).
  Нагадування про їжу й воду сервер надіслати не може: час у `user_reminders`
  настінний, а часового поясу користувача не зберігає ніхто.
- **Push** — поза обсягом специфікації (окремий крок анкети); ні токенів
  пристроїв, ні провайдера немає.
- **Живе оновлення відкритого списку** (відкрите питання) — потребує
  каналу, якого немає; клієнт перезапитує.
- **Строк зберігання не обмежений** (вирішено в специфікації) — сповіщення не
  видаляються. Нічне прибирання воркера чистить лише `refresh_tokens`,
  `otp_codes` і `password_reset_permits`; `notifications` воно не торкається.
- **Порожній стан** (відкрите питання) — сервер віддає `total: 0`, текст
  пише клієнт.
- **Видалення окремого сповіщення** — поза обсягом специфікації.

## Related

- Spec: [./spec.md](./spec.md)
- Plan (хто пише в інбокс): [../producers/plan.md](../producers/plan.md)
- Plan (нагадування): [../../user/reminders/plan.md](../../user/reminders/plan.md)
- ADRs: [ADR-0004](../../../../adr/0004-client-api-url-conventions.md),
  [ADR-0008](../../../../adr/0008-background-jobs.md)
