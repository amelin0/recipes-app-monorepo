---
spec: ./spec.md
status: Approved
owner: '@amelin0'
created: 2026-09-06
updated: 2026-09-06
related-adrs: [ADR-0004]
related-runbooks: []
---

# Plan: Profile edit (Редагування профілю)

> **Status is `Approved`, not `Implemented`:** імʼя редагується, фото — ще ні.
> Завантаження зображень чекає на адаптер сховища — див. «Що ще не побудовано».

## Summary

FR-003 і FR-005 (редагування імені й похідних ініціалів) покриває
`PATCH /profile`. FR-001, FR-002, FR-004 (неактивна кнопка при порожньому
полі) — клієнтські. FR-006 (вибір і показ фото) серверної частини ще не має.

## Database

Таблиця `profiles` описана в [`../profile/plan.md`](../profile/plan.md).
Колонка `photo_url` уже існує й лишається `NULL`, доки не зʼявиться
завантаження.

## API contract

### `PATCH /profile`

**Auth:** `JwtGuard` (Bearer)

**Request body:**

```json
{ "name": "Олег Чередник" }
```

| Field            | Type           | Required                           | Validation                                        |
| ---------------- | -------------- | ---------------------------------- | ------------------------------------------------- |
| `name`           | string         | ні, але тіло не може бути порожнім | обрізається, 1–100 символів після обрізання       |
| `photoUrl`       | string \| null | ні                                 | URL, отриманий цим користувачем з `POST /uploads` |
| `targetWeightKg` | number \| null | ні                                 | 30–250; `null` знімає ціль                        |

**Response 200:** повний `ProfileView` — той самий, що віддає `GET /profile`,
щоб екран, який повертається назад, не робив другий запит по оновлені
ініціали.

**Errors:**

- `422` — порожнє тіло, порожнє чи саме з пробілів імʼя, довше за 100 символів.
- `401`.

**Порожнє імʼя — 422, а не мовчазне збереження.** Кнопка «Зберегти зміни»
неактивна, поки поле порожнє (FR-004), тож порожнє значення не приходить від
екрана: воно означає баг або запит, написаний руками, і обидва заслуговують на
явну відмову.

**Цільова вага редагується тут, хоч її і показує екран прогресу.** Вона
лежить у `profiles.target_weight_kg` з анкети, і фасад під `/progress`, який
писав би в ту саму колонку, дав би одному числу двох власників
([../../progress/metric-logging/plan.md](../../progress/metric-logging/plan.md)).
Схема та сама, що в анкеті, щоб два шляхи до однієї колонки не мали різних
уявлень про допустиме.

**Ліміт у 100 символів** специфікацією не заданий; узятий як розумна межа, щоб
колонка й екран мали передбачуваний максимум.

## Environment variables

Власних не додає.

## File structure

```
apps/client-api/src/modules/user/profile.controller.ts       # PATCH /profile
apps/client-api/src/modules/user/profile.service.ts
packages/validation/src/user.schemas.ts                      # updateProfileSchema, displayNameSchema
packages/database/src/entities/profile.entity.ts             # initials()
```

## Shared contract

- `@dns/validation` — `displayNameSchema`, `updateProfileSchema`. Мобільний
  застосунок переюзає їх у формі, тож «порожнє імʼя» означає те саме на обох
  боках.

## Security & edge cases

- Нормалізація (обрізання пробілів) живе **лише** у схемі. Сервіс приймає вже
  нормалізоване значення, і дублювати `.trim()` у ньому означало б завести два
  місця, які можуть розійтися.
- Профіль оновлюється тільки для власника токена.

## Rollout

- Feature flag: немає.
- Порядок: деплой `client-api` → реліз застосунку. Міграції не потрібно —
  колонки вже є.

## Verification

- `packages/validation/src/user.schemas.test.ts` — обрізання, відмова
  порожньому імені.
- `apps/client-api/test/user-profile.db-spec.ts` — ініціали з двох слів, з
  одного, і їх відсутність, поки імʼя не задане.
- Смоук: `PATCH /profile` з іменем із двох слів має повернути ініціали з двох
  великих літер.

## Що ще не побудовано

**Фото профілю (FR-002, FR-006).** Потрібен адаптер сховища
(`@dns/api-infrastructure/storage` — S3/MinIO з підписаними посиланнями), якого
ще немає, хоча всі `S3_*` у `.env.example` готові. Коли він зʼявиться, флоу
буде: клієнт просить підписане посилання → вантажить файл напряму в сховище →
шле ключ у `PATCH /profile`. Приймати сирий URL від клієнта до того — значить
дозволити записати в профіль будь-яке посилання, тож поле навмисно поки не
приймається.

## Related

- Spec: [./spec.md](./spec.md)
- Plan (сама таблиця і читання): [../profile/plan.md](../profile/plan.md)
- ADRs: [ADR-0004](../../../../adr/0004-client-api-url-conventions.md)
