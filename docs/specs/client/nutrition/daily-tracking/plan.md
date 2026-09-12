---
spec: ./spec.md
status: Implemented
owner: '@amelin0'
created: 2026-09-06
updated: 2026-09-11
related-adrs: [ADR-0004]
related-runbooks: []
---

# Plan: Daily tracking (Денний трекінг)

## Summary

Екран читається одним запитом `GET /nutrition/days/{date}`. FR-001, FR-002,
FR-007, FR-009 і FR-010 покриває цей запит разом із
`POST /nutrition/days/{date}/water` і `PUT /nutrition/days/{date}/steps`.
FR-006, FR-006a і стан страви для FR-006c — поле `plan` того самого запиту:
заплановані на день страви з
[meal-plan](../../meal-plan/plan/plan.md) і позначка «зʼїдено», виведена з
журналу [meal-logging](../meal-logging/plan.md).
FR-003, FR-005, FR-006b, FR-006d, FR-008 і FR-011 — клієнтські: навігація,
порожні стани, підсвічування поточного слоту, свайпи, шапка.

## Database

Власних таблиць не додає — читає `nutrition_goals`
([goal-setup](../goal-setup/plan.md)), `meal_log_entries`
([meal-logging](../meal-logging/plan.md)) плюс дві свої:

### Table `water_log_entries`

| Column      | Type          | Constraints                                 |
| ----------- | ------------- | ------------------------------------------- |
| `id`        | `uuid`        | PK                                          |
| `user_id`   | `uuid`        | NOT NULL, FK → `users.id` ON DELETE CASCADE |
| `log_date`  | `date`        | NOT NULL                                    |
| `amount_ml` | `integer`     | NOT NULL                                    |
| `logged_at` | `timestamptz` | NOT NULL, `now()`                           |

Index: `(user_id, log_date)`.

**Журнал записів, а не лічильник на дні.** Помилковий тап треба вміти забрати,
а лічильник, який лише зростає, потребував би окремого поняття «відміна».
Кожна склянка — свій рядок, і `DELETE` прибирає рівно її.

**Завжди мілілітри**, незалежно від обраної користувачем системи одиниць:
сховище тримає одну канонічну шкалу, конвертує застосунок.

### Table `daily_steps`

| Column       | Type          | Constraints                                       |
| ------------ | ------------- | ------------------------------------------------- |
| `user_id`    | `uuid`        | PK (складений), FK → `users.id` ON DELETE CASCADE |
| `log_date`   | `date`        | PK (складений)                                    |
| `steps`      | `integer`     | NOT NULL                                          |
| `updated_at` | `timestamptz` | NOT NULL, `now()`                                 |

**Одне значення, що замінюється, а не журнал** — дзеркально до води, і
навмисно. «Записати крок» не є дією ніде в продукті: кількість приходить уже
підсумованою, чи то введеною руками, чи то синхронізованою з пристрою, і кожне
повідомлення заміщає попереднє. Якби значення додавалося, друга синхронізація
за день подвоїла б кроки.

Ця ж форма робить неважливим відкрите питання про джерело: і ручне введення, і
майбутній HealthKit пишуть той самий рядок.

## API contract

### `GET /nutrition/days/{date}`

**Auth:** `JwtGuard`

**Response 200:**

```json
{
    "data": {
        "date": "2026-09-06",
        "goal": { "dailyCalories": 1850, "dailyProteinG": 200, "…": "…" },
        "consumed": { "calories": 337, "proteinG": 12, "fatsG": 9, "carbsG": 40, "waterMl": 500 },
        "meals": [{ "id": "<entry>", "slot": "lunch", "recipeId": "<recipe>", "dishName": "Панкейки", "calories": 337, "…": "…" }],
        "plan": [
            { "slot": "breakfast", "items": [] },
            {
                "slot": "lunch",
                "items": [{ "id": "<plan item>", "recipe": { "id": "<recipe>", "title": "Панкейки", "…": "…" }, "eatenEntryId": "<entry>" }]
            },
            { "slot": "dinner", "items": [] },
            { "slot": "snack", "items": [] }
        ],
        "steps": 13000,
        "stepsTarget": 15000
    }
}
```

**`plan` — «Раціон на сьогодні».** Завжди чотири слоти в порядку екрана;
порожній — це «Не заплановано» (FR-005). Страва несе ту саму картку рецепта
(`RecipeCardView`), що й вкладка плану, і будується тим самим кодом
(`MealPlanService.slotsOn`): рядок страви на двох екранах не може
розійтися.

**`eatenEntryId` виводиться з журналу, а не зберігається.** Страва вважається
зʼїденою, коли в тому ж слоті того ж дня є запис журналу з тим самим
`recipeId`; поле несе id цього запису. Прапорець на позиції плану був би
другим записом про ту саму їжу — і в день, коли вони розійшлися б, страва
показувала б «зʼїдено», а кільце її не рахувало б. Звідси й дії FR-006c
без нових маршрутів:

- «зафіксувати як зʼїдене» — `POST /nutrition/days/{date}/meals` із
  `recipeId` і `slot` страви;
- зняти позначку — `DELETE /nutrition/days/{date}/meals/{eatenEntryId}`.

**Один запис закриває одну страву**, найстаріший першим: страва, запланована
в слот двічі, потребує двох записів. Запис без `recipeId` або в іншому слоті
позначки не ставить — але в `meals` і підсумках лишається: зʼїсти поза
планом — теж зʼїсти.

Який слот «поточний» і чи минув він (FR-006b, FR-006c), клієнт вирішує за
часом пристрою: сервер часового поясу користувача не знає.

**Errors:** `422` — дата не є справжнім днем або поза вікном; `401`.

**`goal` буває `null`** — акаунт, який ще не задав ціль. Екран показує заклик
до дії замість кілець; вигадати дефолт означало б поставити перед людиною
числа, яких вона не обирала.

**`consumed` рахується запитом, а не зберігається.** V1 тримав матеріалізовану
`daily_nutrition_summary`, яку мав наповнювати тригер — тригер так і не
написали, і таблиця назавжди показувала нулі. Дві агрегації по індексу
`(user_id, log_date)` коштують менше, ніж друге джерело правди, здатне
розійтися з журналом. FR-007 у meal-logging вимагає, щоб запис одразу впливав
на підсумок — сума по журналу задовольняє це без жодного механізму синхронізації.

**Дата в шляху, а не в query.** Вона називає, **який** ресурс потрібен, а не
звужує вибірку — правило 5 ADR-0004 віддає query фільтрам. Той самий вибір, що
й `/meal-plan/days/{day}`.

### `POST /nutrition/days/{date}/water`

**Request body:** `{ "amountMl": 250 }` — крок картки, але сервер приймає
будь-яку додатну величину до 5000.

**Response 201:** `{ "id": "…", "amountMl": 250 }` — `id` потрібен, щоб склянку
можна було прибрати.

### `DELETE /nutrition/days/{date}/water/{id}`

**Response 204.** **Errors:** `404` `nutrition.water-entry-not-found`.

### `PUT /nutrition/days/{date}/steps`

**Request body:** `{ "steps": 13000 }` — підсумок за день, не приріст.

**Response 200:** `{ "steps": 13000 }`.

`PUT`, бо значення заміщується цілком (ADR-0004, правило 3). `0` — легальне
повідомлення: людина могла не ходити.

**Обмеження цілі води картка не накладає на сервер.** FR-007 каже, що тап не
доливає понад ціль — це поведінка кнопки; сервер прийме і більше, бо ціль може
змінитися заднім числом, а вже випите не має ставати недійсним.

## Environment variables

Власних не додає.

## File structure

```
apps/client-api/src/modules/nutrition/nutrition.controller.ts
apps/client-api/src/modules/nutrition/nutrition.service.ts       # getDay збирає зріз, markEaten
apps/client-api/src/modules/meal-plan/meal-plan.service.ts       # slotsOn — слоти одного дня
apps/client-api/src/modules/nutrition/dto/outbound/daily-slice.view.ts
packages/database/src/schema/{water-log-entries,daily-steps}.schema.ts
packages/database/src/repositories/nutrition/                    # findDailyTotals
packages/validation/src/nutrition.schemas.ts                     # logWaterSchema, setStepsSchema
packages/constants/src/nutrition-policy.ts                       # WATER_PORTION_ML
```

## Shared contract

- `@dns/shared-types` — `MealSlot`, `NutrientProgress`.
- `@dns/constants` — `WATER_PORTION_ML`, `DAILY_STEPS_TARGET_DEFAULT`.

## Security & edge cases

- Усе читається і пишеться лише для власника токена; денний зріз чужого
  акаунту не запитати.
- Дні не змішуються: вода і кроки за вчора не потрапляють у сьогодні —
  покрито тестом.
- Порожній день віддає нулі, а не помилку: акаунт без жодного запису — це
  нормальний стан першого дня.

## Rollout

- Feature flag: немає.
- Порядок: БД-міграція → деплой `client-api` → реліз застосунку.

## Verification

- `apps/client-api/test/nutrition.db-spec.ts`, блок `water and steps` —
  накопичення склянок і відкат однієї, заміщення кроків замість додавання,
  розділення днів.
- Той самий файл, блок `planned dishes` — чотири слоти навіть без плану;
  позначка з'являється із записом і зникає з його видаленням; одна страва на
  один запис; інший слот і запис без рецепта позначки не ставлять; план
  іншого дня не потрапляє.
- Смоук: два `PUT` кроків поспіль (5000, потім 13000) мають лишити 13000, а не 18000.

## Що ще не побудовано

- **Джерело кроків.** Реалізовано лише ручне повідомлення; синхронізація з
  HealthKit / Health Connect пише той самий рядок і схеми не змінює.

## Related

- Spec: [./spec.md](./spec.md)
- Plan (ціль): [../goal-setup/plan.md](../goal-setup/plan.md)
- Plan (записи): [../meal-logging/plan.md](../meal-logging/plan.md)
- ADRs: [ADR-0004](../../../../adr/0004-client-api-url-conventions.md)
