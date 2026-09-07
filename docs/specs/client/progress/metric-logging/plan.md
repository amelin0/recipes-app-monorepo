---
spec: ./spec.md
status: Implemented
owner: '@amelin0'
created: 2026-09-06
updated: 2026-09-06
related-adrs: [ADR-0004, ADR-0007]
related-runbooks: []
---

# Plan: Metric logging (Вимір і ціль)

## Summary

FR-001, FR-004, FR-006, FR-010 і FR-011 — серверна частина: запис і
видалення виміру, перевірка меж, оновлення профілю слідом за вагою і
часткова зміна цілі. FR-002, FR-003, FR-005, FR-007, FR-008 і FR-012
клієнтські — шторка введення, підказка «як вимірювати», екрани підтвердження
і пояснення результату. FR-009 (нагадування) використовує
`PUT /profile/reminders` з [`../../user/reminders/plan.md`](../../user/reminders/plan.md).

Власних таблиць не додає — пише у `body_measurements`
([../metrics-overview/plan.md](../metrics-overview/plan.md)), `profiles` і
`nutrition_goals`.

## Database

Змін немає. Один новий стовпчик не додається навмисно: цільова вага вже є
в `profiles.target_weight_kg` з анкети
([../../onboarding/profile-setup/plan.md](../../onboarding/profile-setup/plan.md)).

## API contract

### `POST /progress/metrics/{metric}/measurements`

**Auth:** `JwtGuard`
**`metric`:** лише `weight`, `waist`, `height`.

**Request body:**

```json
{ "value": 82.5, "measuredOn": "2026-09-06" }
```

`measuredOn` необовʼязковий — без нього береться сьогодні.

**Response 201:**

```json
{ "data": { "id": "…", "metric": "weight", "value": 82.5, "measuredOn": "2026-09-06" } }
```

**Errors:**

- `400` `progress.value-out-of-range` — значення поза межами показника.
- `422` — щоденний показник у шляху, невідомий показник, погана дата.
- `401`.

**Записувати можна вужче коло показників, ніж читати.** Калорії, вода і
кроки пишуться через `/nutrition`, де день, до якого вони належать, є
частиною шляху. Другий шлях запису в те саме число дозволив би логу і
графіку розійтися, і жодного способу сказати, який із них правий, не було б.

**Межі перевіряються в сервісі, а не в схемі тіла.** Який діапазон
застосувати, залежить від показника у шляху, а не від поля в тілі. Межі
живуть у `MEASUREMENT_LIMITS` (`@dns/constants`) — тих самих, з яких
будується крок коліщатка на клієнті (FR-004), тож сервер відхиляє рівно те,
чого інтерфейс не може запропонувати.

**Окремий код помилки, а не голий 422.** Коли клієнт і сервер розійдуться в
межах, застосунок має відрізнити «ви ввели неможливе» від «запит зламаний».

**Вага і зріст додатково оновлюють `profiles`.** Норма калорій рахується з
профілю наживо; без цього застосунок пропонував би «оновлену норму»
(FR-006), пораховану з ваги, яку людина замінила тижні тому. Талія профілю
не торкається — у формулі її немає.

### `DELETE /progress/metrics/{metric}/measurements/{id}`

**Response 204.** `404` `progress.measurement-not-found` — і коли запису
немає, і коли він чужий: власнику одного акаунта не варто повідомляти, що
запис існує в іншого.

### `PATCH /nutrition/goal`

**Auth:** `JwtGuard`

Будь-яка підмножина полів цілі; порожнє тіло → `422`.

```json
{ "dailyWaterMl": 3000 }
```

**Response 200:** ціль повністю. `404` `nutrition.goal-not-found`, якщо цілі
ще немає.

**`PATCH` поруч із наявним `PUT`, а не замість нього.** Екран цілі зберігає
всі сім полів разом — для нього `PUT` правильний. Картка прогресу міняє
одне (FR-010), і надсилання цілої цілі заради одного числа перезаписало б
решту шести тим, що цей екран колись прочитав (ADR-0004, правило 4).

**Калорії через цей же `PATCH`, хоч FR-011 і вимагає окремого екрана.**
Окремий екран — вимога до інтерфейсу; окремий ендпоінт для одного поля
цілі був би третім шляхом запису в ту саму таблицю.

### `PATCH /profile` — поле `targetWeightKg`

Цільова вага редагується там, де вона зберігається, — у профілі. Фасад
`/progress`, який писав би в ту саму колонку, дав би одному числу двох
власників.

`null` знімає ціль. Значення в межах `ONBOARDING_LIMITS.weightKg` — та сама
схема, що й в анкеті, щоб два шляхи до однієї колонки не мали різних
уявлень про допустиме.

## Environment variables

Власних не додає.

## File structure

```
apps/client-api/src/modules/progress/progress.controller.ts          # POST/DELETE measurements
apps/client-api/src/modules/progress/progress.service.ts             # record(), remove()
apps/client-api/src/modules/progress/progress.errors.ts
apps/client-api/src/modules/progress/dto/inbound/record-measurement.inbound.dto.ts
apps/client-api/src/modules/nutrition/nutrition.controller.ts        # PATCH /nutrition/goal
apps/client-api/src/modules/user/profile.service.ts                  # targetWeightKg
packages/database/src/repositories/nutrition/nutrition.repository.ts # updateGoal()
packages/validation/src/progress.schemas.ts
packages/validation/src/nutrition.schemas.ts                         # patchNutritionGoalSchema
packages/validation/src/user.schemas.ts                              # targetWeightKgSchema
```

## Shared contract

- `@dns/shared-types` — `BodyMetric`.
- `@dns/validation` — `recordMeasurementSchema`, `bodyMetricParamSchema`,
  `patchNutritionGoalSchema`, `targetWeightKgSchema`.
- `@dns/constants` — `MEASUREMENT_LIMITS`.

## Security & edge cases

- Видалення обмежене власником у самому `WHERE`, а не перевіркою після
  читання.
- Значення зберігається як `numeric` з двома знаками; профіль отримує один —
  та сама точність, що й в анкеті.
- Дата виміру проходить ту саму перевірку вікна, що й дати трекінгу: захист
  від пристрою зі зламаним годинником.
- `PATCH /nutrition/goal` не створює ціль. Створення — це `PUT` з екрана
  цілі, де людина бачить усі сім чисел; мовчки народити ціль із одного поля
  означало б вигадати шість інших.

## Verification

- `apps/client-api/test/progress.db-spec.ts` — запис і поява на картці,
  відмова на значенні поза межами, перенесення ваги і зросту в профіль,
  талія профілю не чіпає, видалення чужого запису → 404.
- `apps/client-api/test/nutrition.db-spec.ts` — часткова зміна цілі не
  чіпає решту полів; патч без наявної цілі → 404.
- Смоук: `PATCH /nutrition/goal` з одним полем повертає всі сім;
  `PATCH /profile` з `targetWeightKg` віддає його назад, `null` знімає.

## Що ще не побудовано

- **FR-007 (пояснення результату талії)** — сервер віддає межу
  `recommendedMax`; текст пояснення пише клієнт.
- **FR-009 (нагадування про зважування)** — потребує нового значення в
  `reminder_type`; поки нагадування домену профілю не мають цього типу.
- **Межі і крок кожного показника** лишаються відкритим питанням
  специфікації: числа в `MEASUREMENT_LIMITS` вибрані як правдоподібні, а не
  погоджені з фахівцем — так само як норми в
  [ADR-0007](../../../../adr/0007-daily-norm-formulas.md).
- **Що саме показує картка рекомендації після зважування** (відкрите питання
  FR-006) — сервер лише тримає `GET /profile/recommendations` актуальним;
  коли її показувати, вирішує клієнт.

## Related

- Spec: [./spec.md](./spec.md)
- Plan (огляд): [../metrics-overview/plan.md](../metrics-overview/plan.md)
- Plan (деталь показника): [../metric-detail/plan.md](../metric-detail/plan.md)
- Plan (ціль харчування): [../../nutrition/goal-setup/plan.md](../../nutrition/goal-setup/plan.md)
- Plan (анкета): [../../onboarding/profile-setup/plan.md](../../onboarding/profile-setup/plan.md)
- ADRs: [ADR-0004](../../../../adr/0004-client-api-url-conventions.md),
  [ADR-0007](../../../../adr/0007-daily-norm-formulas.md)
