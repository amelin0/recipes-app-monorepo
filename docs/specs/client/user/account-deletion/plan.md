---
spec: ./spec.md
status: Approved
owner: '@amelin0'
created: 2026-09-06
updated: 2026-09-11
related-adrs: [ADR-0004, ADR-0005]
related-runbooks: ['../../../../runbooks/execute-overdue-account-deletions.md']
---

# Plan: Account deletion (Видалення акаунту)

> **Status is `Approved`, not `Implemented`:** запит, скасування і маршрутизація
> на екран відновлення працюють, але завдання, яке виконує видалення після
> 30 днів, ще не написане — див. «Що ще не побудовано».

## Summary

FR-001, FR-002, FR-003 і FR-005 лягають на таблицю
`account_deletion_requests`, пару `POST` / `DELETE /profile/deletion-request`
і поле `deletionScheduledFor` у `GET /auth/me`. FR-000a, FR-000b (слово
підтвердження), FR-004 (відлік до секунди), FR-006, FR-007 — клієнтські.
FR-008 (пояснити невдачу) забезпечують коди помилок нижче.

Ця специфікація **замінює** FR-009 зі spec profile, яка описувала безповоротне
видалення без пільгового періоду.

## Database

### Table `account_deletion_requests`

| Column          | Type          | Constraints                                 |
| --------------- | ------------- | ------------------------------------------- |
| `id`            | `uuid`        | PK                                          |
| `user_id`       | `uuid`        | NOT NULL, FK → `users.id` ON DELETE CASCADE |
| `scheduled_for` | `timestamptz` | NOT NULL — коли пільговий період спливає    |
| `cancelled_at`  | `timestamptz` | NULL                                        |
| `executed_at`   | `timestamptz` | NULL                                        |
| `created_at`    | `timestamptz` | NOT NULL, `now()`                           |

Indexes:

- `account_deletion_requests_user_id_idx` on `(user_id)` — історія запитів
  акаунта і шлях каскаду від `users`.
- `account_deletion_requests_one_active_per_user` — **частковий унікальний**
  на `(user_id) WHERE cancelled_at IS NULL AND executed_at IS NULL`.

**«Один чинний запит» тримає база, а не сервіс.** Раніше сервіс спершу
читав «чи є чинний», а потім вставляв; подвійний тап проходив перевірку
обома запитами, і в акаунта ставало два чинні запити. Скасування знімало
один — другий лишався і стер би акаунт, який користувач щойно відновив.
Тепер вставка — `INSERT … ON CONFLICT DO NOTHING RETURNING`: другий запит у
польоті чекає на коміт першого, упирається в індекс і нічого не пише, а
порожній `RETURNING` сервіс перетворює на наявний `409`.

**Міграція мусить спершу прибрати дублікати**, інакше `CREATE UNIQUE INDEX`
упаде на базі, де гонка вже траплялась. Два кроки, у тій самій транзакції,
що й індекс, і перед ним:

```sql
LOCK TABLE account_deletion_requests IN SHARE ROW EXCLUSIVE MODE;

-- 1. Запит, що існував у момент, коли користувач натиснув «відновити», —
--    скасований. Старе скасування знімало один довільний рядок; той, що
--    лишився, і є акаунт, який стерли б після відновлення.
UPDATE account_deletion_requests r
SET cancelled_at = c.last_cancel
FROM (
    SELECT user_id, max(cancelled_at) AS last_cancel
    FROM account_deletion_requests
    WHERE cancelled_at IS NOT NULL
    GROUP BY user_id
) c
WHERE r.user_id = c.user_id
  AND r.cancelled_at IS NULL
  AND r.executed_at IS NULL
  AND r.created_at < c.last_cancel;

-- 2. Серед решти чинних лишається найраніший, пізніші видаляються.
DELETE FROM account_deletion_requests r
USING (
    SELECT id,
           row_number() OVER (PARTITION BY user_id ORDER BY created_at, scheduled_for, id) AS rn
    FROM account_deletion_requests
    WHERE cancelled_at IS NULL AND executed_at IS NULL
) d
WHERE r.id = d.id AND d.rn > 1;
```

- **Крок 1 іде першим, і це юридичний бік.** Легітимний повторний запит
  завжди створений **після** попереднього скасування; чинний рядок, старший
  за скасування того самого акаунта, міг вижити лише як двійник, якого
  скасування не зачепило. Штамп — справжній момент, коли користувач
  відновив акаунт, тож історія не вигадує дії. Сумнівний випадок (запит і
  відновлення натиснуті майже одночасно) розвʼязується на користь
  збереження акаунта: новий запит подати можна, стертий акаунт не повернути.
- **Найраніший у кроці 2** — бо саме його прийняв би виправлений код:
  правило нижче («другий запит відхиляється, а не подовжує строк»)
  застосоване заднім числом. Строк не зсувається від першого обіцяного.
- **Видалення, а не `cancelled_at`, у кроці 2.** Дубль — не окремий запит, а
  другий запис того самого наміру, розведений на мілісекунди. Штамп
  скасування вигадав би в історії дію, якої користувач не робив.
- `LOCK` — щоб старий код, який ще крутиться під час розгортання, не вставив
  новий дубль між прибиранням і побудовою індексу.

**Таблиця, а не пара колонок на `users`.** Сутність у специфікації має історію
— запит можна скасувати і згодом подати новий, — і рядок несе момент, за яким
діятиме прибиральне завдання.

**Стан виводиться, не зберігається.** «Чинний» означає, що ні `cancelled_at`,
ні `executed_at` не заповнені. Колонка `state` була б другим джерелом правди,
здатним розійтися з мітками часу.

## API contract

### `POST /profile/deletion-request`

**Auth:** `JwtGuard` (Bearer)

**Response 201:**

```json
{
    "data": {
        "id": "<uuid>",
        "requestedAt": "2026-09-06T14:56:52.239Z",
        "scheduledFor": "2026-10-06T14:56:52.239Z",
        "state": "active"
    }
}
```

**Errors:**

- `409` `user.deletion-already-requested` — запит уже чинний.
- `401`.

**Сесія навмисно не відкликається.** Відновлення (FR-005) — авторизований
виклик; якби запит на видалення обривав сесії, користувач опинився б на екрані
відновлення без змоги ним скористатися. Акаунт лишається повністю робочим
протягом пільгового періоду — це і є сенс періоду.

### `DELETE /profile/deletion-request`

**Auth:** `JwtGuard` (Bearer)

**Response 204** — запит скасовано, акаунт з усіма даними знову повністю
доступний.

**Errors:**

- `404` `user.no-deletion-request` — скасовувати нема чого. Код потрібен, щоб
  екран відновлення пояснив, що сталося (FR-008), а не мовчав.
- `401`.

`DELETE` на самому запиті, а не дія `restore`: користувач скасовує саме
**запит**, і той або існує, або ні (ADR-0004, правило 6).

### `GET /auth/me` — додане поле

```json
{ "data": { "id": "…", "email": "…", "emailVerifiedAt": "…", "deletionScheduledFor": "2026-10-06T14:56:52.239Z" } }
```

`null`, коли нічого не заплановано. Ненульове значення означає, що застосунок
має відкрити екран відновлення замість застосунку (FR-003).

**Чому в `/auth/me`, а не в `/profile`.** Це стан акаунту, як і підтвердження
пошти, і застосунку він потрібен одразу після входу — до того, як він вирішить,
який екран показати. Розмежування `/auth/me` (стан акаунту) і `/profile`
(профільний агрегат) зафіксоване в ADR-0004.

**Чому не в `JwtStrategy`.** Тоді за пошук платив би кожен авторизований
запит, а звітує про це рівно один маршрут.

## Environment variables

Власних не додає. Тривалість пільгового періоду —
`ACCOUNT_DELETION_GRACE_DAYS` у `@dns/constants`: це продуктове рішення, а не
налаштування середовища.

## File structure

```
apps/client-api/src/modules/user/account-deletion.controller.ts
apps/client-api/src/modules/user/account-deletion.service.ts
apps/client-api/src/modules/user/user.errors.ts
apps/client-api/src/modules/user/dto/outbound/account-deletion-request.view.ts
apps/client-api/src/modules/auth/auth.controller.ts        # GET /auth/me
apps/client-api/src/modules/auth/dto/outbound/current-user.view.ts
packages/database/src/schema/account-deletion-requests.schema.ts
packages/database/src/entities/account-deletion-request.entity.ts
packages/database/src/repositories/account-deletion-request/
```

## Shared contract

- `@dns/shared-types` — `AccountDeletionState`.
- `@dns/constants` — `ACCOUNT_DELETION_GRACE_DAYS`.

## Security & edge cases

- Другий запит при чинному першому відхиляється, а не подовжує строк —
  інакше повторним натисканням можна було б відсувати видалення нескінченно.
  Відхиляє частковий унікальний індекс, тож це тримається й під паралельними
  запитами; сповіщення з датою пише лише той запит, що справді записався.
- Скасування — **один умовний `UPDATE` за власником токена по всіх чинних
  рядках** (так само, як `cancelDeletionRequest` в адмінці), без попереднього
  читання. Ідентифікатор запиту клієнт не передає, тож чужий скасувати не
  можна. Друге скасування в польоті чекає на блокування рядка, перевіряє
  `cancelled_at IS NULL` наново, нічого не знаходить і отримує `404`;
  сповіщення «скасовано» йде лише тоді, коли `UPDATE` щось змінив.
- `ON DELETE CASCADE` означає, що коли акаунт таки зникне, зникнуть і його
  запити — історія видалень у цій таблиці не переживає видалення.

## Rollout

- Feature flag: немає.
- Порядок: БД-міграція → деплой `client-api` → реліз застосунку.
- До появи прибирального завдання жоден акаунт не зникає: запити накопичуються
  зі спливлим `scheduled_for`. Це безпечний бік помилки, але тимчасовий.

## Verification

- `apps/client-api/test/user-profile.db-spec.ts`, блок `account deletion` —
  строк у 30 днів, живучість сесії, відмова на другий запит, скасування і
  можливість подати новий, пояснення при скасуванні без чинного запиту.
  Підблок `under concurrent taps` (`Promise.all`): шість паралельних запитів
  дають рівно один чинний рядок і одне сповіщення; шість паралельних
  скасувань лишають нуль чинних і одне сповіщення; прямий `INSERT` другого
  чинного рядка база відхиляє; гонка запиту зі скасуванням не лишає більше
  одного чинного.
- Смоук: після `POST` поле `deletionScheduledFor` у `/auth/me` має стати
  ненульовим, після `DELETE` — знову `null`.

## Що ще не побудовано

**Виконання видалення (FR-002).** Немає завдання, яке б проходило по рядках зі
спливлим `scheduled_for` і стирало акаунт із даними. Причина не в обсязі
роботи: спершу треба вирішити, чого саме воно торкається — це
[ADR-0005](../../../../adr/0005-what-account-deletion-erases.md), і він поки
`Proposed`, бо впирається в строки зберігання фінансових записів.

Поки завдання немає, прострочені запити накопичуються і **нічого не
відбувається саме собою**. Проміжна ручна процедура —
[`execute-overdue-account-deletions`](../../../../runbooks/execute-overdue-account-deletions.md),
щотижня.

Накопичення тепер хоча б видно — рахувати не значить видаляти:

- **Моніторинг.** Воркер щогодини (і раз на старті) рахує відкриті запити й
  публікує `dns_account_deletion_requests_open{state="overdue"|"waiting"}` та
  `dns_account_deletion_requests_oldest_overdue_seconds`. Алерт
  `dns-overdue-account-deletions` дивиться на **вік** найстарішого
  простроченого запиту (поріг 10 днів — «тижневий запуск пропустили»), а не на
  кількість: ненульова кількість — нормальний стан посеред тижня.
- **Адмінка.** Банер «N прострочених запитів» на сторінці користувачів і
  сигнал на головній ведуть у відфільтрований список `/users/?deletion=overdue`.
- **Інбокс.** Створення і скасування запиту пишуть сповіщення власникові
  акаунта ([`../../notifications/producers/plan.md`](../../notifications/producers/plan.md)).

Окремий наслідок чинної схеми: `executed_at` ніколи не заповнюється. Рядок
запиту зникає разом із користувачем через `ON DELETE CASCADE`, тож факт
виконання доводиться фіксувати поза базою. Коли ADR-0005 буде ухвалено, це
варто переглянути — журнал видалень може виявитися саме тим, що має пережити
акаунт.

## Related

- Spec: [./spec.md](./spec.md)
- Замінює FR-009 у [`../profile/spec.md`](../profile/spec.md)
- ADRs: [ADR-0004](../../../../adr/0004-client-api-url-conventions.md),
  [ADR-0005](../../../../adr/0005-what-account-deletion-erases.md)
- Алерт і метрики: `infra/prod/README.md`, `apps/worker/src/jobs/pending-work/`
