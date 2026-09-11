---
spec: ./spec.md
status: Implemented
owner: '@amelin0'
created: 2026-09-06
updated: 2026-09-11
related-adrs: [ADR-0004, ADR-0007]
related-runbooks: []
---

# Plan: Goal setup (Налаштування цілі)

## Summary

FR-007 і FR-008 — серверна частина: одна таблиця `nutrition_goals` і пара
`GET` / `PUT /nutrition/goal`. FR-001, FR-002, FR-004, FR-005, FR-009 —
клієнтські: пресети, степери, затискання значень у діапазон, картка балансу
макросів і попередження про незбережені зміни. FR-006 (картки ваги, зросту,
активності) читає профіль, який заповнює онбординг.

FR-003a (рекомендоване значення в шторці нутрієнта) — `GET /profile/recommendations`
з [`../../onboarding/profile-setup/plan.md`](../../onboarding/profile-setup/plan.md):
калорії, білки, жири, вуглеводи, клітковина, вода і кроки, пораховані
Mifflin-St Jeor із профілю ([ADR-0007](../../../../adr/0007-daily-norm-formulas.md)).
Окремого маршруту під цей екран немає — два шляхи до однієї рекомендації
розійшлися б на першій правці формули.

Діапазони й кроки зі FR-002 і FR-003 живуть у `NUTRITION_GOAL_LIMITS`
(`@dns/constants`) — тими самими числами степер обмежує клієнта і схема
перевіряє сервер.

## Database

### Table `nutrition_goals`

| Column                      | Type          | Constraints                                |
| --------------------------- | ------------- | ------------------------------------------ |
| `user_id`                   | `uuid`        | PK **і** FK → `users.id` ON DELETE CASCADE |
| `daily_calories`            | `integer`     | NOT NULL                                   |
| `daily_protein_g`           | `integer`     | NOT NULL                                   |
| `daily_fats_g`              | `integer`     | NOT NULL                                   |
| `daily_carbs_g`             | `integer`     | NOT NULL                                   |
| `daily_water_ml`            | `integer`     | NOT NULL                                   |
| `daily_fiber_g`             | `integer`     | NOT NULL                                   |
| `daily_steps_target`        | `integer`     | NOT NULL                                   |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL, `now()`                          |

**Один рядок на акаунт, без історії.** Out of Scope специфікації явно виключає
історію змін цілі, тож версіонувати нема чого — збереження замінює рядок
цілком.

**Рядка немає, доки користувач не збереже ціль.** Це навмисно: екран трекінгу
показує заклик до дії замість кілець, а вигадати дефолт означало б поставити
перед людиною числа, яких вона не обирала. Порівняйте з `user_settings`, де
дефолти навпаки пишуться при реєстрації — там кожне значення нейтральне, тут
кожне є твердженням про здоровʼя.

**Межі — у схемі запиту, не в `CHECK`.** Порушення діапазону це помилка
введення, і 422 з назвою поля корисніший за помилку БД, яку доводиться
перекладати. Діапазони ще й змінюватимуться разом із дизайном степерів, а це
не привід для міграції.

**`daily_steps_target` попри те, що його ніде не налаштувати.** Картка кроків
(daily-tracking FR-010) показує ціль, але екрана для неї немає. Колонка з
дефолтом дозволяє додати екран без міграції; тримати ціль константою в коді
означало б, що перша ж персоналізація її потребує.

### Migrations

- `0003_dry_lady_ursula.sql` — `nutrition_goals`, `meal_log_entries`,
  `water_log_entries`, `daily_steps`.

## API contract

### `GET /nutrition/goal`

**Auth:** `JwtGuard`

**Response 200:** обʼєкт цілі, або `{"data": null}`, якщо ціль ще не задано.

### `PUT /nutrition/goal`

**Auth:** `JwtGuard`

**Request body:**

```json
{
    "dailyCalories": 1850,
    "dailyProteinG": 200,
    "dailyFatsG": 60,
    "dailyCarbsG": 180,
    "dailyWaterMl": 2000,
    "dailyFiberG": 30
}
```

| Field              | Range                         | Step (клієнт) |
| ------------------ | ----------------------------- | ------------- |
| `dailyCalories`    | 1000–5000                     | 50            |
| `dailyProteinG`    | 40–350                        | 5             |
| `dailyFatsG`       | 20–200                        | 2             |
| `dailyCarbsG`      | 30–500                        | 5             |
| `dailyWaterMl`     | 500–5000                      | 100           |
| `dailyFiberG`      | 10–60                         | 1             |
| `dailyStepsTarget` | 1000–50000, **необовʼязкове** | 500           |

**Response 200:** ціль після збереження.

**Errors:** `422` — значення поза діапазоном або відсутнє поле; `401`.

**`PUT`, а не `PATCH`:** ціль — синглтон, і екран зберігає її цілком (ADR-0004,
правило 3). Тіло має нести всі шість нутрієнтів: часткове збереження лишило б
ціль напів-старою, а картка балансу макросів рахується з усіх трьох одразу.

**Поруч є `PATCH /nutrition/goal`** для вужчої дії — картка прогресу міняє
одне поле цілі
([../../progress/metric-logging/plan.md](../../progress/metric-logging/plan.md)).
Він не створює ціль: народити її з одного поля означало б вигадати шість
інших. Створення лишається за цим екраном.

**Крок степера сервер не перевіряє.** 1837 ккал так само коректна ціль, як
1850 — крок це зручність введення, і перевірка на кратність відхиляла б
значення, які прийде час дозволити (наприклад, обчислену рекомендацію).

### Рекомендація: `GET /profile/recommendations`

Описана в [`../../onboarding/profile-setup/plan.md`](../../onboarding/profile-setup/plan.md).
Для цього екрана важливі дві властивості:

- **`null`, доки анкета не зібрала все потрібне.** Акаунт, що пропустив
  анкету, отримає шторку без рекомендації — норма, порахована з вигаданої
  ваги, виглядала б так само авторитетно, як справжня.
- **Макроси рахуються для рекомендованих калорій, не для обраних.** Якщо
  людина пересунула степер калорій, рекомендовані грами з відповіді
  стосуються іншої цілі. Розподіл за ціллю — чиста функція `macroTargetsFor`
  у `@dns/constants`: клієнт, якому треба грами саме під обрані калорії, кличе
  її з тими самими аргументами й отримує те, що порахував би сервер.

## Environment variables

Власних не додає.

## File structure

```
apps/client-api/src/modules/nutrition/nutrition.controller.ts    # GET/PUT /nutrition/goal
apps/client-api/src/modules/nutrition/nutrition.service.ts
apps/client-api/src/modules/nutrition/dto/outbound/daily-slice.view.ts   # NutritionGoalView
packages/database/src/schema/nutrition-goals.schema.ts
packages/database/src/entities/nutrition.entity.ts
packages/database/src/repositories/nutrition/
packages/validation/src/nutrition.schemas.ts                     # upsertNutritionGoalSchema
packages/constants/src/nutrition-policy.ts                       # NUTRITION_GOAL_LIMITS
```

## Shared contract

- `@dns/constants` — `NUTRITION_GOAL_LIMITS`, `DAILY_STEPS_TARGET_DEFAULT`.
- `@dns/validation` — `upsertNutritionGoalSchema`. Клієнт бере з неї межі для
  степерів, тож розійтися з сервером вони не можуть.

## Security & edge cases

- Ціль читається і пишеться лише для власника токена; параметра з чужим
  користувачем у контракті немає.
- Ціль із трьома нулями в макросах формально проходить (діапазони цього не
  забороняють), і картка балансу на клієнті ділить на суму — це відкрите
  питання специфікації, див. нижче.

## Rollout

- Feature flag: немає.
- Порядок: БД-міграція → деплой `client-api` → реліз застосунку.

## Verification

- `packages/validation/src/nutrition.schemas.test.ts` — межі кожного поля,
  обовʼязковість усіх шести нутрієнтів, необовʼязковість цілі по кроках.
- `apps/client-api/test/nutrition.db-spec.ts`, блок `goal` — відсутність цілі
  у нового акаунту, заміна при повторному збереженні, дефолт кроків.
- Смоук: `GET /nutrition/goal` одразу після реєстрації має віддати `null`.
- `apps/client-api/test/onboarding.db-spec.ts`, блок `recommendations` —
  `null` до повної анкети, збіг із розрахунковим прикладом, залежність від
  мети і від зміни ваги.

## Що ще не побудовано

- **Узгодження калорій і макросів** (Open Question специфікації): зараз обидва
  зберігаються незалежно, і зміна калорій не перераховує грами. Якщо
  вирішиться на користь автоперерахунку, знадобиться прапорець на кшталт
  V1-шного `is_auto_calculated`.
- **Норми води й кроків не підписані фахівцем** — ADR-0007 `Proposed`.
  Рекомендація для них працює, але числа обрано інженерно.

## Related

- Spec: [./spec.md](./spec.md)
- Plan (де ціль читається): [../daily-tracking/plan.md](../daily-tracking/plan.md)
- Plan (рекомендація): [../../onboarding/profile-setup/plan.md](../../onboarding/profile-setup/plan.md)
- ADRs: [ADR-0004](../../../../adr/0004-client-api-url-conventions.md),
  [ADR-0007](../../../../adr/0007-daily-norm-formulas.md)
