# Recipe Domain — Overview

## Архітектура

Рецепти підтримують мультимовність. Текстові поля (title, cooking_instructions, ingredient names, tag names) зберігаються в окремих `*_translations` таблицях. Числові дані (КБЖВ, amount, unit) — в основних таблицях.

Мова визначається автоматично з `profiles.language` авторизованого юзера через `authMiddleware`.

## DB схема

```
recipes                    — числові дані
├── recipe_translations    — title, cooking_instructions per language

ingredients                — базова сутність
├── ingredient_translations — name per language

tags                       — базова сутність
├── tag_translations        — name per language

recipe_ingredients         — junction (recipe ↔ ingredient + amount + unit)
recipe_tags                — junction (recipe ↔ tag)
```

## Measurement units

Enum `measurement_unit`: `g`, `ml`, `tsp`, `tbsp`, `cup`, `pcs`

## Ролі

| Дія | USER | ADMIN | SUPER_ADMIN |
|-----|------|-------|-------------|
| GET recipes | + | + | + |
| POST recipe | - | - | + |
| PUT recipe | - | - | + |
| POST tag | - | - | + |
| POST ingredient | - | - | + |

## Endpoints

### Client (mobile)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/recipes` | Список з фільтрами |
| GET | `/api/recipes/tags` | Всі теги (поточна мова) |
| GET | `/api/recipes/:id` | Деталі рецепту |

### Admin (web)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/admin/recipes` | ADMIN+ | Список рецептів |
| GET | `/api/admin/recipes/:id` | ADMIN+ | Деталі |
| POST | `/api/admin/recipes` | SUPER_ADMIN | Створити рецепт |
| PUT | `/api/admin/recipes/:id` | SUPER_ADMIN | Оновити рецепт |
| POST | `/api/admin/recipes/delete` | SUPER_ADMIN | Bulk delete (`{ ids: string[] }`) |
| GET | `/api/admin/recipes/:id/full` | ADMIN+ | Рецепт з усіма перекладами |
| GET | `/api/admin/recipes/tags/all` | ADMIN+ | Всі теги |
| POST | `/api/admin/recipes/tags` | SUPER_ADMIN | Створити тег |
| GET | `/api/admin/recipes/ingredients/all` | ADMIN+ | Всі інгредієнти |
| POST | `/api/admin/recipes/ingredients` | SUPER_ADMIN | Створити інгредієнт |

## Фільтри (GET /recipes)

| Param | Type | Description |
|-------|------|-------------|
| search | string | Пошук по title (ilike) |
| tags | string | Comma-separated tag names |
| min_proteins_g | number | Мін. білки |
| min_carbs_g | number | Мін. вуглеводи |
| min_fats_g | number | Мін. жири |
| min_calories | number | Мін. калорії |
| max_calories | number | Макс. калорії |
| page | number | Default: 1 |
| limit | number | Default: 20 |

## Create Recipe Request (SUPER_ADMIN)

```json
{
  "photo_url": "https://...",
  "calories": 550,
  "proteins_g": 45,
  "carbs_g": 10,
  "fats_g": 36,
  "servings": 2,
  "translations": [
    { "language": "uk", "title": "Запечений лосось", "cooking_instructions": ["Крок 1...", "Крок 2..."] },
    { "language": "en", "title": "Baked salmon", "cooking_instructions": ["Step 1...", "Step 2..."] }
  ],
  "ingredients": [
    { "ingredient_id": "uuid", "amount": 200, "unit": "g" },
    { "ingredient_id": "uuid", "amount": 1, "unit": "tbsp" }
  ],
  "tag_ids": ["uuid-breakfast", "uuid-health"]
}
```

## Response (formatted)

```json
{
  "id": "uuid",
  "photo_url": "https://...",
  "title": "Запечений лосось",
  "calories": 550,
  "proteins_g": 45,
  "carbs_g": 10,
  "fats_g": 36,
  "servings": 2,
  "cooking_instructions": ["Крок 1...", "Крок 2..."],
  "ingredients": [
    { "id": "uuid", "name": "Лосось", "amount": 200, "unit": "g" }
  ],
  "tags": [
    { "id": "uuid", "name": "Сніданок" }
  ]
}
```

Відповідь завжди повертається мовою юзера — nested translations flattened в `formatRecipe()`.

## Калорії (авто-розрахунок)

Калорії вираховуються автоматично на фронті:
- 1г білків = 4 ккал
- 1г вуглеводів = 4 ккал
- 1г жирів = 9 ккал
- `calories = proteins_g * 4 + carbs_g * 4 + fats_g * 9`

## Seed теги

Health, Vegetarian, Keto, Breakfast, Lunch, Dinner — вже є в БД з перекладами на uk/en/ru/es.

## Deploy

- **API**: `cd apps/api && supabase functions deploy api --project-ref sctetzydpkkmbjbuanls --import-map supabase/functions/deno.json`
- **Web**: `pnpm deploy:web` (Vercel)
