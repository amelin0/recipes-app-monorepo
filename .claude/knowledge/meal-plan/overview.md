# Meal Plan Domain — Overview

## Концепт

Тижневий план харчування. Юзер призначає рецепти на дні тижня по слотах (сніданок, обід, вечеря, перекус). План повторюється щотижня — не прив'язаний до конкретних дат, а до днів тижня.

Кожен слот може мати кілька рецептів. Plan ≠ Tracking — план це що юзер планує їсти, а tracking (food-log, пізніше) це що по факту з'їв.

## Endpoints (Client only)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/meal-plan/week` | Повний тижневий план |
| GET | `/api/meal-plan/today` | План на сьогодні |
| GET | `/api/meal-plan/day/:day` | План на конкретний день |
| POST | `/api/meal-plan` | Додати рецепт `{day_of_week, meal_type, recipe_id, servings}` |
| DELETE | `/api/meal-plan/items/:id` | Видалити item |
| DELETE | `/api/meal-plan/day/:day` | Очистити день |
| POST | `/api/meal-plan/copy-day` | Копіювати день `{from_day, to_day}` |
| POST | `/api/meal-plan/day/:day/to-shopping-list` | Додати всі страви дня в shopping list |

## Enums

- `day_of_week`: monday, tuesday, wednesday, thursday, friday, saturday, sunday
- `meal_type`: breakfast, lunch, dinner, snack

Labels для meal_type перекладаються на фронті через i18n (фіксовані категорії).

## POST Request

```json
{
  "day_of_week": "monday",
  "meal_type": "breakfast",
  "recipe_id": "uuid",
  "servings": 1.5
}
```

`servings` — NUMERIC(4,1), підтримує 0.5, 1, 1.5 і т.д.

## GET /meal-plan/week Response

```json
{
  "monday": {
    "breakfast": [{ "id": "item-uuid", "meal_type": "breakfast", "servings": 1, "recipe": { "id": "...", "title": "Вівсянка", "calories": 320, ... } }],
    "lunch": [],
    "dinner": [{ ... }],
    "snack": []
  },
  "tuesday": { ... },
  ...
}
```

## GET /meal-plan/today Response

```json
{
  "breakfast": [{ "id": "...", "meal_type": "breakfast", "servings": 1, "recipe": { ... } }],
  "lunch": [],
  "dinner": [],
  "snack": []
}
```

## Copy Day

```json
{ "from_day": "monday", "to_day": "wednesday" }
```

Очищає target day і копіює всі items з source day. Повертає новий план для target day.

## Day to Shopping List

POST `/api/meal-plan/day/monday/to-shopping-list`

Додає всі рецепти з цього дня в shopping list з відповідними servings. Повертає оновлений shopping list.

## DB

### meal_plan_items

| Column | Type | Note |
|--------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → auth.users |
| day_of_week | day_of_week | enum |
| meal_type | meal_type | enum |
| recipe_id | UUID | FK → recipes |
| servings | NUMERIC(4,1) | default 1 |
| created_at | TIMESTAMPTZ | |
| UNIQUE | (user_id, day_of_week, meal_type, recipe_id) | |

## Зв'язки

- Recipe titles повертаються мовою юзера (через recipe_translations)
- `to-shopping-list` використовує ShoppingListService.addRecipe()
- На головному екрані: `/meal-plan/today` + `/nutrition/daily` = повна картина дня
