---
spec: ./spec.md
status: Implemented
owner: '@amelin0'
created: 2026-09-06
updated: 2026-09-06
related-adrs: [ADR-0004]
related-runbooks: []
---

# Plan: Meal logging (Логування прийому їжі)

## Summary

FR-004, FR-006 і FR-007 — серверна частина: таблиця `meal_log_entries` і
`POST /nutrition/days/{date}/meals`. FR-001, FR-002, FR-003, FR-005 і FR-008 —
клієнтські: точки входу, вибір кількості порцій, перетягування по тарілці,
показ повної ваги страви і те, що екран підтвердження є тупиком.

Головне рішення тут — **зліпок замість посилання**. Це ж рішення дозволяє
доменові працювати до появи каталогу рецептів.

## Database

### Table `meal_log_entries`

| Column                                        | Type           | Constraints                                              |
| --------------------------------------------- | -------------- | -------------------------------------------------------- |
| `id`                                          | `uuid`         | PK                                                       |
| `user_id`                                     | `uuid`         | NOT NULL, FK → `users.id` ON DELETE CASCADE              |
| `log_date`                                    | `date`         | NOT NULL                                                 |
| `slot`                                        | `meal_slot`    | NOT NULL — `breakfast` \| `lunch` \| `dinner` \| `snack` |
| `recipe_id`                                   | `uuid`         | NULL, без FK — доки немає таблиці рецептів               |
| `dish_name`                                   | `text`         | NOT NULL                                                 |
| `portions`                                    | `integer`      | NOT NULL                                                 |
| `eaten_fraction`                              | `numeric(4,3)` | NOT NULL                                                 |
| `credited_calories`                           | `integer`      | NOT NULL                                                 |
| `credited_protein_g` / `_fats_g` / `_carbs_g` | `numeric(7,2)` | NOT NULL                                                 |
| `credited_weight_g`                           | `numeric(8,2)` | NOT NULL                                                 |
| `total_weight_g`                              | `numeric(8,2)` | NOT NULL                                                 |
| `logged_at`                                   | `timestamptz`  | NOT NULL, `now()`                                        |

Indexes:

- `meal_log_entries_user_date_idx` on `(user_id, log_date)` — по ньому
  рахується денний підсумок.

**Зараховані числа — зліпок, а не посилання.** Рецепт можна відредагувати —
власну страву особливо, — а екран підтвердження є чеком того, що було правдою
в момент запису (FR-006). Перерахунок на читанні тихо переписав би історію:
вчорашній обід змінив би калорійність від того, що сьогодні хтось виправив
рецепт.

**`recipe_id` nullable і поки без зовнішнього ключа.** Каталогу рецептів ще
немає, а запис і без нього повний — саме зліпок робить домен придатним до
роботи вже зараз. FK додається разом із таблицею рецептів; жодна міграція
даних для цього не потрібна.

**`log_date` окремо від `logged_at`.** Їжа о 01:00 належить попередньому
вечору для того, хто її їсть. Вивести день із мітки часу неможливо — сервер не
знає часового поясу пристрою, тож дату називає клієнт.

**`eaten_fraction` як `numeric(4,3)`, а не відсоток.** Частка бере участь у
множенні; зберігати 41 і ділити на 100 при кожному читанні означало б
округлювати двічі.

## API contract

### `POST /nutrition/days/{date}/meals`

**Auth:** `JwtGuard`

**Request body:**

```json
{
    "slot": "lunch",
    "dishName": "Панкейки",
    "recipeId": null,
    "portions": 2,
    "eatenFraction": 0.5,
    "perPortion": { "calories": 337, "proteinG": 12, "fatsG": 9, "carbsG": 40, "weightG": 210 }
}
```

| Field           | Validation                           |
| --------------- | ------------------------------------ |
| `slot`          | один із чотирьох                     |
| `dishName`      | 1–200 символів                       |
| `recipeId`      | UUID, необовʼязкове                  |
| `portions`      | ціле ≥ 1                             |
| `eatenFraction` | 0.01–1                               |
| `perPortion.*`  | невідʼємні; `weightG` строго додатна |

**Response 201:** запис із зарахованими числами.

**Errors:** `422` — порція нульової ваги, зʼїдено нічого або більше за
приготоване, дробова кількість порцій; `401`.

**Множення робить сервер, а не клієнт.** Тіло несе числа **однієї порції**, а
`portions × eatenFraction` застосовує сервер. Інакше збережений чек міг би
розійтися з тим, що показав екран підтвердження — а SC-003 вимагає, щоб вони
збігалися. Так обидва беруться з однієї арифметики над одними входами.

**`total_weight_g` рахується від `portions`, без частки** — це вся приготована
страва, включно з порціями для інших (FR-005). Вона показується і ніколи не
зараховується.

### `DELETE /nutrition/days/{date}/meals/{id}`

**Auth:** `JwtGuard`

**Response 204.** **Errors:** `404` `nutrition.meal-entry-not-found`; `401`.

Пошук іде за парою (id, власник токена), тож чужий запис не видалити — і
відповідь на чужий id така сама, як на неіснуючий, щоб не підтверджувати його
існування.

**Повторний запис тієї самої страви створює другий рядок**, а не замінює
перший: Out of Scope специфікації виключає редагування збереженого прийому, а
двічі зʼїдені панкейки — це нормальний день. Виправлення помилки — видалити і
записати заново.

## Environment variables

Власних не додає.

## File structure

```
apps/client-api/src/modules/nutrition/nutrition.service.ts       # logMeal, deleteMeal
apps/client-api/src/modules/nutrition/nutrition.controller.ts
apps/client-api/src/modules/nutrition/nutrition.errors.ts
apps/client-api/src/modules/nutrition/dto/                       # logMealSchema, MealLogEntryView
packages/database/src/schema/meal-log-entries.schema.ts
packages/database/src/repositories/nutrition/
packages/validation/src/nutrition.schemas.ts
```

## Shared contract

- `@dns/shared-types` — `MealSlot`.
- `@dns/validation` — `logMealSchema`, `logDateSchema`.
- `@dns/constants` — `EATEN_FRACTION`, `LOG_DATE_WINDOW_DAYS`.

## Security & edge cases

- Запис створюється і видаляється лише для власника токена.
- `date` у шляху перевіряється тією ж схемою, що й поле тіла: без цього
  друкарська помилка створила б день, який уже не знайти.
- Дата обмежена вікном (рік назад, доба вперед) — захист від пристрою зі
  зламаним годинником, достатньо широкий, щоб переліт через лінію зміни дат не
  відхилявся.
- `numeric` повертається з Postgres рядком; перетворення в число робиться один
  раз у сутності, а не на кожному місці використання.

## Rollout

- Feature flag: немає.
- Порядок: БД-міграція → деплой `client-api` → реліз застосунку.
- **Клієнт зможе логувати лише те, для чого має числа порції.** Доки немає
  каталогу рецептів, це власноруч введена страва; після нього застосунок
  братиме `perPortion` з деталей рецепта. Контракт від цього не змінюється.

## Verification

- `packages/validation/src/nutrition.schemas.test.ts` — межі частки, цілі
  порції, ненульова вага порції, вікно дат.
- `apps/client-api/test/nutrition.db-spec.ts`, блок `meal logging` — зарахування
  половини від двох порцій, повна вага страви, миттєвий вплив на підсумок,
  подвійний запис, видалення, ізоляція між акаунтами.
- Смоук: дві порції по 337 ккал зі зʼїденою половиною мають дати рівно 337
  зарахованих ккал і 420 г повної ваги.

## Related

- Spec: [./spec.md](./spec.md)
- Plan (де запис зʼявляється): [../daily-tracking/plan.md](../daily-tracking/plan.md)
- ADRs: [ADR-0004](../../../../adr/0004-client-api-url-conventions.md)
