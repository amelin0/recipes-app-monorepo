---
spec: ./spec.md
status: Implemented
owner: '@amelin0'
created: 2026-09-08
updated: 2026-09-08
related-adrs: [ADR-0002, ADR-0003, ADR-0004, ADR-0005]
related-runbooks: [execute-overdue-account-deletions]
---

# Plan: User directory (Каталог користувачів)

## Summary

Читання поверх наявних `users` / `profiles` / `user_settings` /
`subscriptions` / `account_deletion_requests` (FR-001…FR-003), одна нова
колонка для блокування (FR-005…FR-007) і скасування запиту на видалення
(FR-009).

Рішення власника продукту від 2026-09-08:

| Питання | Рішення |
|---|---|
| Глибина блокування | **`blocked_at` + відкликання всіх сесій** |
| Запити на видалення | Бачити і **скасовувати**; виконання — ні |
| Обсяг картки | Акаунт + підписка + активність, **без анкети про тіло** |
| Інші дії над акаунтом | Немає |

⚠️ **Видалення акаунта в цьому зрізі немає, і це рішення, а не пропуск.**
[ADR-0005](../../../../adr/0005-what-account-deletion-erases.md) досі
`Proposed`, а його
[runbook](../../../../runbooks/execute-overdue-account-deletions.md) прямо
каже: щойно з'явиться таблиця `subscriptions` — жорстке видалення
виконувати не можна, доки ADR не ухвалено і схему не приведено до нього.
`subscriptions` з'явилася у зрізі 13. Тож кнопка «видалити» з панелі
робила б саме те, що заборонено (FR-011).

## Database

### Зміна: `users.blocked_at`

| Column | Type | Constraints |
|---|---|---|
| `blocked_at` | `timestamptz` | NULL |

Момент, а не булеве: «коли заблокували» відповідає на питання підтримки, на
яке `is_blocked = true` не відповідає, і коштує стільки ж.

Колонка на `users`, а не на `profiles`: `JwtStrategy` і так читає `users` на
кожному запиті (щоб видалений акаунт не дожив у токені), тож перевірка
блокування не додає жодного запиту — саме це й дає SC-002.

Індексу не додаємо: заблокованих одиниці на десятки тисяч, і фільтр за ними
не селективний у той бік, який індекс прискорює.

### Migrations

- `0015_*.sql` — одна колонка.

## API contract

Базовий шлях `/api/v1`, конверт `{data}`, camelCase (ADR-0002/0004). Усі
маршрути під Bearer + ADMIN/SUPER_ADMIN (FR-013).

### `GET /api/v1/users`

Query: `search`, `isBlocked`, `isEmailVerified`, `hasSubscription`,
`deletion` (`none` | `active` | `overdue`), `page`, `limit`.

```json
{ "id": "…", "email": "someone@example.com", "name": "Олег",
  "language": "uk", "isEmailVerified": true, "blockedAt": null,
  "hasActiveSubscription": true, "deletionScheduledFor": null,
  "createdAt": "…" }
```

**Лічильника прострочених запитів окремим ендпоінтом немає** (FR-010):
`deletion=overdue` з `limit=1` уже повертає `meta.total`. Друге джерело тієї
самої цифри розійшлося б із фільтром у перший же день, коли одне з двох
навчиться враховувати скасовані.

Пошук — за email та ім'ям профілю. Email зберігається вже в нижньому
регістрі, тож `ilike` по ньому не бреше.

### `GET /api/v1/users/:id`

Те саме плюс:

```json
{ "signInMethods": ["password", "apple"],
  "subscription": { "status": "active", "planSlug": "premium-year",
                    "source": "purchase", "expiresAt": "…" },
  "activity": { "ownRecipes": 4, "favorites": 12, "lastSeenAt": "…" },
  "deletionRequest": { "scheduledFor": "…", "isOverdue": false } }
```

`lastSeenAt` — це `max(refresh_tokens.created_at)`: рядок з'являється і на
вході, і на кожному оновленні сесії, тож це найдешевший чесний слід
активності. Він **не** означає «останній запит до API» і так і підписаний у
панелі.

**Анкети тут немає навмисно** (FR-004): стать, вага, зріст, ціль і харчові
норми — це медично-чутливі дані, і робота цього зрізу («знайти акаунт,
зупинити акаунт, розібратися із запитом») жодного з них не потребує.

### `PATCH /api/v1/users/:id/block`

`{ "blocked": true | false }` → `204`.

Порядок операцій той самий, що в адмінському `setActive`, і він має значення:

```
1. UPDATE users SET blocked_at = now()   -- спершу прапорець
2. DELETE refresh_tokens WHERE user_id   -- потім сесії
```

Навпаки — і refresh, що прийшов між двома операціями, застав би живий акаунт,
чиї токени щойно видалили, тобто видав би нову пару вже після блокування.

Розблокування — тільки крок 1 зі скиданням у `null`: відкликані сесії не
оживають (FR-007).

### `DELETE /api/v1/users/:id/deletion-request`

Скасовує **активний** запит (FR-009) → `204`; `404`, якщо активного немає.

Видаляється запит, а не акаунт — шлях названо так, щоб цю різницю не можна
було прочитати навпаки. Рядок лишається в таблиці з `cancelled_at`: історія
запитів це частина сутності (див. коментар у схемі).

## Enforcement блокування

Дві точки, і разом вони покривають усі шляхи:

1. **`TokenService.issuePair`** — через нього проходять вхід, підтвердження
   email, OAuth **і** refresh (він викликає сам себе на ротації). Одна
   перевірка тут закриває кожен спосіб отримати сесію.
2. **`JwtStrategy.validate`** — уже перечитує акаунт на кожному запиті, тож
   живий access-токен помирає на наступному ж виклику. Це і є SC-002.

Код помилки — новий `auth.account-blocked` (403). Він **не** ховається за
`invalid-credentials`: користувач із правильним паролем має побачити, що
справа не в паролі, інакше він буде його скидати по колу. Розкриття тут
немає — до цієї гілки доходить лише той, хто вже довів, що акаунт його.

## Environment variables

Нових немає.

## File structure

```
packages/database/src/schema/users.schema.ts             # + blocked_at
packages/database/src/entities/user.entity.ts            # + isBlocked()
packages/database/src/migrations/0015_*.sql
packages/database/src/repositories/admin-user/

packages/validation/src/admin-user.schemas.ts

apps/admin-api/src/modules/user/
  user.controller.ts  user.service.ts  user.module.ts  user.errors.ts

apps/client-api/src/modules/auth/token.service.ts        # issuePair: відмова
apps/client-api/src/modules/auth/strategies/jwt.strategy.ts
apps/client-api/src/modules/auth/auth.errors.ts          # + account-blocked

apps/web/src/data/remote/domains/user/
apps/web/src/state/domains/user/
apps/web/src/view/user/
```

## Security & edge cases

- **Усі маршрути за роллю** (FR-013).
- **Блокування не чіпає запит на видалення** і навпаки: це два різні наміри —
  наш і користувача.
- **Заблокований із активною підпискою** — магазин про блокування не знає й
  списує далі. Картка показує підписку поруч із блокуванням саме тому.
- **Акаунт без профілю** — усі поля картки, крім акаунтних, порожні. Список
  бере `left join`, тобто такий користувач не зникає з нього.
- **`deletion=overdue` рахує лише активні прострочені** — скасовані й
  виконані не потрапляють, інакше цифра ніколи не спадала б.
- **Редагування чужого профілю не існує як маршрут** (FR-012), а не ховається
  в інтерфейсі.

## Rollout

- Feature flag: немає.
- Порядок: міграція → деплой **обох** API (клієнтський теж — саме він
  застосовує блокування) → публікація панелі.
- Видима зміна для користувачів: жодної, доки нікого не заблоковано.

## Verification

- DB-тести (admin): список і фільтри; блокування ставить момент і видаляє
  сесії; розблокування не оживляє їх; скасування запиту лишає акаунт і
  зберігає рядок; `deletion=overdue` не рахує скасовані.
- DB-тести (client): заблокований не входить із правильним паролем;
  заблокований не оновлює сесію; заблокований отримує 401 із живим
  access-токеном; після розблокування вхід працює.
- Тест на порядок операцій: після блокування в `refresh_tokens` немає жодного
  рядка користувача.
- Смоук: увійти застосунком, заблокувати з панелі, наступний запит — 401.

## Related

- Spec: [./spec.md](./spec.md)
- ADRs: [ADR-0003](../../../../adr/0003-auth-model-tokens-and-admin-permissions.md),
  [ADR-0005](../../../../adr/0005-what-account-deletion-erases.md)
- Runbook: [`execute-overdue-account-deletions`](../../../../runbooks/execute-overdue-account-deletions.md)
