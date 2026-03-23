# Shopping List Domain — Overview

## Концепт

Один активний shopping list на юзера. Юзер додає рецепти з кількістю порцій → система автоматично агрегує інгредієнти. Інгредієнти відображаються як чекбокс-список для покупок.

## Endpoints (Client only)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/shopping-list` | Отримати список (рецепти + items) |
| POST | `/api/shopping-list` | Додати рецепт `{recipe_id, servings}` |
| DELETE | `/api/shopping-list/recipes/:id` | Видалити рецепт зі списку |
| PATCH | `/api/shopping-list/items/:id/toggle` | Toggle checked |
| DELETE | `/api/shopping-list/clear` | Очистити весь список |

## Логіка агрегації

При додаванні/видаленні рецепту — `recalculateItems()`:

1. Отримати всі рецепти в списку з їх інгредієнтами
2. Для кожного інгредієнта: `recipe_amount × (user_servings / recipe_servings)`
3. Агрегувати по `ingredient_id + unit` (сумувати amount)
4. Зберегти `is_checked` стан для existing items
5. Замінити items новими агрегованими

**Приклад:** Рецепт на 2 порції (лосось 200g), юзер хоче 4 порції → 400g лосось.

## GET Response

```json
{
  "recipes": [
    { "id": "slr-uuid", "recipe_id": "r-uuid", "title": "Запечений лосось", "servings": 4 }
  ],
  "items": [
    { "id": "item-uuid", "ingredient_id": "i-uuid", "name": "Лосось", "total_amount": 400, "unit": "g", "is_checked": false },
    { "id": "item-uuid", "ingredient_id": "i-uuid", "name": "Оливкова олія", "total_amount": 2, "unit": "tbsp", "is_checked": true }
  ]
}
```

Items відсортовані: unchecked першими, checked останніми.

## DB

### shopping_lists
| Column | Type | Note |
|--------|------|------|
| id | UUID | PK |
| user_id | UUID | FK, UNIQUE (один на юзера) |

### shopping_list_recipes
| Column | Type | Note |
|--------|------|------|
| id | UUID | PK |
| shopping_list_id | UUID | FK |
| recipe_id | UUID | FK → recipes |
| servings | INT | Бажана кількість порцій |

### shopping_list_items
| Column | Type | Note |
|--------|------|------|
| id | UUID | PK |
| shopping_list_id | UUID | FK |
| ingredient_id | UUID | FK → ingredients |
| total_amount | NUMERIC(10,2) | Агрегована кількість |
| unit | measurement_unit | g, ml, tsp, tbsp, cup, pcs |
| is_checked | BOOLEAN | default false |
| UNIQUE | (shopping_list_id, ingredient_id, unit) | |

## Зв'язки

- Залежить від `recipes` та `recipe_ingredients` для розрахунку
- Ingredient names повертаються мовою юзера (через translations)
- Recipe titles також через translations
