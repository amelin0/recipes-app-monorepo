---
spec: ./spec.md
status: Implemented
owner: '@amelin0'
created: 2026-09-11
updated: 2026-09-11
related-adrs: [ADR-0004, ADR-0005]
related-runbooks: ['../../../../runbooks/execute-overdue-account-deletions.md']
---

# Plan: Feedback (Зворотній звʼязок)

> План написано після коду: ендпоінт існує з серпня (зріз 4 у `HANDOFF.md`),
> а специфікація досі стояла `Draft` без плану. Документ описує те, що
> побудовано, а не намір.

## Summary

FR-008 — серверна частина: одна таблиця `feedback` і один маршрут
`POST /profile/feedback`. Зображення (FR-005) вантажаться повз API через
`POST /uploads` із метою `feedback`, як фото профілю. FR-003 (межі опису) і
FR-004 (валідація при надсиланні) тримає одна схема в `@dns/validation`, яку
переюзає форма. FR-001, FR-002, FR-006, FR-007 — клієнтські: блоки форми,
пояснення типів, підказка під email, екран підтвердження.

Читає звернення адмінка — [support inbox](../../../admin/support/inbox/plan.md):
черга зі станами, внутрішні нотатки, відповідь поштою. Це закриває відкрите
питання специфікації «куди приходять звернення».

## Database

### Table `feedback`

| Column                      | Type              | Constraints                                  |
| --------------------------- | ----------------- | -------------------------------------------- |
| `id`                        | `uuid`            | PK                                           |
| `user_id`                   | `uuid`            | NULL, FK → `users.id` **ON DELETE SET NULL** |
| `type`                      | `feedback_type`   | NOT NULL                                     |
| `status`                    | `feedback_status` | NOT NULL, default `new`                      |
| `description`               | `text`            | NOT NULL                                     |
| `image_urls`                | `text[]`          | NOT NULL, default `{}`                       |
| `reply_email`               | `text`            | NULL                                         |
| `context`                   | `jsonb`           | NULL                                         |
| `created_at` / `updated_at` | `timestamptz`     | NOT NULL, `now()`                            |

Index: `feedback_status_created_at_idx` на `(status, created_at)` — черга
адмінки фільтрує за станом і сортує за часом.

Енуми: `feedback_type` — `bug`, `not_working`, `improvement`,
`feature_request`, `other` (FR-002, пʼять варіантів); `feedback_status` —
`new`, `in_progress`, `resolved`, `rejected`. Стан рухає лише адмінка.

**Звернення переживає автора.** `user_id` обнуляється, текст і вкладення
лишаються: звіт про збій корисний і після того, як автор пішов, а
[ADR-0005](../../../../adr/0005-what-account-deletion-erases.md) обирає
знеособлення звернень замість видалення. **Але `SET NULL` не чистить
`reply_email`** — особиста адреса лишилася б у тікеті. Тому рунбук видалення
стирає її явним `UPDATE` перед видаленням акаунта, і це покрито тестом.

**`reply_email` окремо від `users.email`.** Людина може хотіти відповідь на
іншу адресу, а тікет мусить нести адресу й тоді, коли акаунта вже немає.

**Зображення — масив URL, а не дочірня таблиця.** Їх записують один раз,
читають разом і ніколи не запитують поодинці.

**`context` — вільний JSON.** Специфікація лишає відкритим, який саме
технічний контекст збирати (FR-008); фіксований набір колонок вимагав би
міграції на кожне нове поле.

### Migrations

- `0002_unknown_amphibian.sql` — енуми, таблиця, індекс.
- `0016_flashy_captain_stacy.sql` — стан `rejected` і `feedback_notes`
  (адмінська частина).

## API contract

### `POST /profile/feedback`

**Auth:** `JwtGuard` (Bearer)

**Request body:**

```json
{
    "type": "bug",
    "description": "Список рецептів порожній одразу після входу.",
    "imageUrls": ["https://…/users/<id>/feedback/…-shot.jpg"],
    "replyEmail": "me@example.com",
    "context": { "appVersion": "1.0.0", "platform": "ios", "build": 1 }
}
```

| Field         | Type                                     | Required | Validation                                      |
| ------------- | ---------------------------------------- | -------- | ----------------------------------------------- |
| `type`        | enum `FeedbackType`                      | так      | один із пʼяти                                   |
| `description` | string                                   | так      | обрізається, 10–1000 символів (FR-003)          |
| `imageUrls`   | string[]                                 | ні       | до 3; кожен — URL з `POST /uploads` цього користувача з метою `feedback` |
| `replyEmail`  | string                                   | ні       | формат email                                    |
| `context`     | `Record<string, string\|number\|boolean>` | ні       | пласкі пари ключ-значення                       |

**Response 201:** `{ "id": "…", "type": "bug", "status": "new", "createdAt": "…" }`.

**Квитанція, а не луна.** Екрану підтвердження (FR-007) потрібен доказ, що
звернення дійшло, а не власний текст людини назад.

**Errors:**

- `422` — тип не з переліку, опис коротший за 10 чи довший за 1000 символів,
  понад три зображення, некоректний email. Повідомлення називають, що
  виправити (FR-004, SC-002).
- `400` — зображення не з нашого сховища, чуже або вивантажене для іншої
  мети (наприклад, як фото профілю).
- `401`.

**Шлях під `/profile`**, бо звернення подає поточний користувач про себе, а
колекції звернень у клієнтському API немає: історії звернень специфікація
не передбачає (Out of Scope).

## Environment variables

Власних не додає. Вкладення використовують `S3_*` сховища, спільні з фото
профілю.

## File structure

```
apps/client-api/src/modules/user/feedback.controller.ts      # POST /profile/feedback
apps/client-api/src/modules/user/feedback.service.ts         # validateOwnership кожного вкладення
apps/client-api/src/modules/user/dto/outbound/feedback.view.ts
apps/client-api/src/modules/uploads/uploads.controller.ts    # POST /uploads
packages/database/src/schema/feedback.schema.ts
packages/database/src/repositories/feedback/
packages/validation/src/user.schemas.ts                      # createFeedbackSchema, presignUploadSchema
packages/shared-types/src/feedback.ts                        # FeedbackType, FeedbackStatus
```

## Shared contract

- `@dns/shared-types` — `FeedbackType`, `FeedbackStatus`, `StorageScope.Feedback`.
- `@dns/validation` — `createFeedbackSchema`. Мобільний застосунок бере з неї
  межі опису й ліміт зображень, тож «мінімум 10 символів» означає те саме на
  обох боках.

## Security & edge cases

- **Кожне вкладення перевіряється на власника і мету.** Без цього тікет міг би
  нести будь-який URL, і співробітник, що відкриває звернення, завантажував
  би те, на що вказав автор.
- Тікет пишеться лише від імені власника токена; `user_id` із тіла не
  береться.
- Окремого ліміту на маршрут немає — діє глобальний throttler; дозвіл на
  вивантаження має власне правило (`FileUploadPresign`).
- Чернетки при відправленні без мережі (відкрите питання) сервер не зберігає —
  це поведінка клієнта.

## Rollout

- Feature flag: немає.
- Порядок: БД-міграція → деплой `client-api` → реліз застосунку.

## Verification

- `apps/client-api/test/user-feedback.db-spec.ts` — тікет із вкладеннями і
  контекстом; відмова вкладенню, вивантаженому як фото профілю; відмова
  адресі поза сховищем; тікет переживає автора, а `reply_email` каскад не
  чистить.
- **Юніт-тестів схеми немає.** Межі опису (10–1000) і ліміт у три зображення
  в `createFeedbackSchema` тестами не покриті — ні в `@dns/validation`, ні в
  db-специфікації.

## Що ще не побудовано

- **Автоматична відповідь автору** — немає: співробітник відповідає поштою
  вручну з картки звернення (рішення від 2026-09-08, див. support inbox).
- **Який технічний контекст збирати** (FR-008, відкрите питання) — сервер
  приймає будь-які пласкі пари; набір визначає клієнт.

## Related

- Spec: [./spec.md](./spec.md)
- Plan (адмінська черга): [../../../admin/support/inbox/plan.md](../../../admin/support/inbox/plan.md)
- Plan (сховище, фото): [../profile-edit/plan.md](../profile-edit/plan.md)
- ADRs: [ADR-0004](../../../../adr/0004-client-api-url-conventions.md),
  [ADR-0005](../../../../adr/0005-what-account-deletion-erases.md)
- Runbooks: [execute-overdue-account-deletions](../../../../runbooks/execute-overdue-account-deletions.md)
