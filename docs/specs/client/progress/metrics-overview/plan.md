---
spec: ./spec.md
status: Implemented
owner: '@amelin0'
created: 2026-09-06
updated: 2026-09-06
related-adrs: [ADR-0004, ADR-0007]
related-runbooks: []
---

# Plan: Metrics overview (Екран прогресу)

## Summary

FR-001…FR-006 — серверна частина: одна таблиця `body_measurements` для
разових вимірів і один ендпоінт `GET /progress/metrics`, що збирає всі шість
карток. FR-007, FR-008, FR-010 клієнтські (перемикач КБЖВ, навігація,
шторка нагадувань). FR-009 і FR-011 ведуть у
[`../metric-logging/plan.md`](../metric-logging/plan.md) — там описані запис
виміру і зміна цілі.

**Ключове рішення домену: три з шести показників тут не зберігаються.**
Калорії (КБЖВ), вода і кроки вже належать домену `nutrition` — прогрес їх
**читає**, а не веде окремо. Власними тут є лише вага, обʼєм талії і зріст.
Альтернатива — своя таблиця показників на всі шість — дала б одному числу
два джерела, і перший же розбіг між денним екраном і графіком нікому не
вдалося б пояснити.

## Database

### Нова таблиця `body_measurements`

| Column        | Type           | Constraints                                |
| ------------- | -------------- | ------------------------------------------ |
| `id`          | `uuid`         | PK, default `gen_random_uuid()`            |
| `user_id`     | `uuid`         | NOT NULL, FK `users(id)` ON DELETE CASCADE |
| `metric`      | `body_metric`  | NOT NULL — `weight` \| `waist` \| `height` |
| `value`       | `numeric(6,2)` | NOT NULL                                   |
| `measured_on` | `date`         | NOT NULL — день, який назвав клієнт        |
| `created_at`  | `timestamptz`  | NOT NULL, default `now()`                  |

Індекс `body_measurements_user_metric_date_idx` на
`(user_id, metric, measured_on)` — усі три читання домену йдуть саме цим
шляхом.

**Одна таблиця на три показники, а не три таблиці.** Вага, талія і зріст
відрізняються лише одиницею і межами; окремі таблиці означали б три
однакових репозиторії і три однакових міграції щоразу, коли додається
четвертий показник.

**`numeric`, а не `real`.** 79.4 кг має лишитися 79.4, а не стати
79.40000152587891 у зведенні за місяць.

**`measured_on` окремо від `created_at`.** Людина може внести вчорашнє
зважування сьогодні; графік має поставити точку на день вимірювання, а
історія запису лишається у `created_at`.

**Каскад від `users`.** Виміри тіла — персональні дані і зникають разом з
акаунтом ([ADR-0005](../../../../adr/0005-what-account-deletion-erases.md)).

### Migrations

- `0005_ambiguous_blob.sql` — енум `body_metric`, таблиця і індекс.

## API contract

### `GET /progress/metrics?days=30`

**Auth:** `JwtGuard`

`days` — 1…365, за замовчуванням 30.

**Response 200:**

```json
{
    "data": [
        {
            "metric": "weight",
            "kind": "one-off",
            "unit": "kg",
            "current": 82.5,
            "initial": 84,
            "goal": 75,
            "recommendedMax": null,
            "points": [{ "id": "…", "date": "2026-09-06", "value": 82.5, "target": null, "outcome": null }]
        },
        {
            "metric": "water",
            "kind": "daily",
            "unit": "ml",
            "current": 2400,
            "initial": null,
            "goal": 2500,
            "recommendedMax": null,
            "points": [{ "id": null, "date": "2026-09-06", "value": 2400, "target": 2500, "outcome": "on-target" }]
        }
    ]
}
```

Порядок карток фіксований: вага, КБЖВ, вода, кроки, талія, зріст.

**Усі шість карток одним запитом.** Екран показує їх одночасно, і шість
поїздок на сервер заради одного екрана — саме той водоспад, від якого
клієнт побудований тікати.

**`kind` — дискримінатор, а не косметика.** Він каже і який графік
малювати (лінія проти стовпчиків, FR-004 і FR-005), і які поля точки
заповнені. Клієнт розгалужується один раз, за цим полем, а не вгадує за
формою обʼєкта.

**Точка має одну форму на обидва види графіка.** Лінійна і стовпчикова
точки відрізняються лише тим, які поля заповнені; окремі типи змусили б
клієнт писати дискримінатор двічі.

**`current` читається поза вікном.** Вага, зважена два місяці тому, — це
все ще вага цієї людини, і картка мусить показати число, навіть коли за
обрані 30 днів вимірів не було. Порожній графік при заповненому `current` —
нормальний стан, а не суперечність.

**День без записів приходить нулем, а не відсутнім.** Стовпчик за такий
день має бути видимий як «нічого» (FR-005); пропуск у масиві клієнт мусив
би відновлювати сам, дублюючи календар.

**`outcome` рахує сервер.** Три стани дня (FR-006) залежать від допуску
навколо цілі, а це продуктове рішення
([ADR-0007](../../../../adr/0007-daily-norm-formulas.md), `DAILY_TARGET_TOLERANCE`),
не питання відображення. Клієнт, який рахував би сам, зафіксував би
10 % у застосунку, і зміна допуску потребувала б релізу.

**`recommendedMax` є лише в талії.** ВООЗ публікує верхню межу (94 см /
80 см), нижньої немає; вигадати її, щоб інтерфейс міг показати діапазон,
означало б вигадати медичне твердження.

**`goal` для ваги — це `profiles.target_weight_kg`, для щоденних — ціль з
`nutrition_goals`.** Прогрес нічого власного не зберігає і в цьому питанні.

## Environment variables

Власних не додає.

## File structure

```
apps/client-api/src/modules/progress/progress.controller.ts
apps/client-api/src/modules/progress/progress.service.ts
apps/client-api/src/modules/progress/progress.errors.ts
apps/client-api/src/modules/progress/dto/inbound/progress-window.query.ts
apps/client-api/src/modules/progress/dto/outbound/progress-card.view.ts
packages/database/src/schema/body-measurements.schema.ts
packages/database/src/entities/body-measurement.entity.ts
packages/database/src/repositories/body-measurement/
packages/validation/src/progress.schemas.ts
packages/constants/src/nutrition-formulas.ts        # DAILY_TARGET_TOLERANCE, WAIST_RECOMMENDED_MAX_CM
```

## Shared contract

- `@dns/shared-types` — `BodyMetric`, `ProgressMetric`, `MetricKind`,
  `DailyOutcome`.
- `@dns/validation` — `progressWindowSchema`, `progressMetricParamSchema`.
- `@dns/constants` — `DAILY_TARGET_TOLERANCE`, `WAIST_RECOMMENDED_MAX_CM`,
  `PROGRESS_DEFAULT_DAYS`, `PROGRESS_MAX_DAYS`.

## Security & edge cases

- Кожне читання і кожен запис обмежені власником токена; репозиторій
  фільтрує за `user_id` навіть там, де `id` уже унікальний.
- Вікно обмежене 365 днями: `days` приходить із рядка запиту, і без стелі
  один запит міг би змусити сервер зібрати десятиліття по дню.
- Акаунт без цілі отримує `goal: null` і `outcome: null` замість
  підставленого числа — стан «ціль не задана» має виглядати саме так.

## Verification

- `apps/client-api/test/progress.db-spec.ts` — 19 тестів: повний набір
  карток на порожньому акаунті, один стовпчик на день із пропусками,
  читання щоденних показників із логу харчування, перенесення цілі,
  `null` замість вигаданої цілі, свіже значення поза вікном, межа талії за
  статтю.
- Смоук проти живого сервера: запис ваги, `days=999` → 422, шлях
  `/progress/metrics/calories/measurements` → 422 (щоденний показник не
  приймає вимір).

## Що ще не побудовано

- **FR-006 у частині «спожито проти цілі» двома стовпчиками** — сервер
  віддає обидва числа (`value` і `target`) у кожній точці; пара стовпчиків
  малюється клієнтом.
- **FR-010 (нагадування про зважування)** використовує
  `PUT /profile/reminders` з [`../../user/reminders/plan.md`](../../user/reminders/plan.md);
  окремого типу нагадування для ваги ще немає — це рядок у переліку
  `reminder_type`, коли фіча дійде до реалізації.
- **Межі норми КБЖВ** (відкрите питання специфікації) закриті інженерно:
  допуск ±10 % навколо цілі, зафіксований у `DAILY_TARGET_TOLERANCE`.
  Число вибране, а не взяте з джерела.

## Related

- Spec: [./spec.md](./spec.md)
- Plan (деталь показника): [../metric-detail/plan.md](../metric-detail/plan.md)
- Plan (запис виміру і ціль): [../metric-logging/plan.md](../metric-logging/plan.md)
- Plan (денний трекінг): [../../nutrition/daily-tracking/plan.md](../../nutrition/daily-tracking/plan.md)
- ADRs: [ADR-0004](../../../../adr/0004-client-api-url-conventions.md),
  [ADR-0007](../../../../adr/0007-daily-norm-formulas.md)
