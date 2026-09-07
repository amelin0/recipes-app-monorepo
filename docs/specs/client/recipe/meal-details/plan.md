---
spec: ./spec.md
status: Approved
owner: '@amelin0'
created: 2026-09-07
updated: 2026-09-07
related-adrs: [ADR-0004, ADR-0006]
related-runbooks: []
---

# Plan: Meal details (Деталі страви)

## Summary

FR-002, FR-004, FR-005 і FR-011 — серверна частина: один ендпоінт
`GET /recipes/{id}`, який віддає картку, обидва набори чисел (на порцію і
на всю страву), склад із порахованим внеском кожного інгредієнта і кроки
приготування. FR-001 і FR-003 клієнтські (фото, таби). FR-007, FR-008,
FR-009 — арифметика шторки порцій, теж клієнтська: масштабування має бути
миттєвим і без мережі (SC-002). FR-006 і FR-010 ведуть в інші домени.

Власних таблиць не додає — читає схему з
[`../recipes-list/plan.md`](../recipes-list/plan.md).

Статус `Approved`, а не `Implemented`: дві дії екрана (додати до раціону,
додати до списку продуктів) впираються в домени, яких ще немає.

## Database

Змін немає.

## API contract

### `GET /recipes/{id}`

**Auth:** `JwtGuard`

**Response 200:**

```json
{
    "data": {
        "id": "…",
        "title": "Різото з грибами",
        "source": "global",
        "photoUrl": "https://…",
        "cookTimeMinutes": 25,
        "servings": 2,
        "isFavorite": true,
        "perServing": { "calories": 450, "proteinG": 20, "fatsG": 10, "carbsG": 45, "weightG": 300 },
        "total": { "calories": 900, "proteinG": 40, "fatsG": 20, "carbsG": 90, "weightG": 600 },
        "category": { "id": "…", "slug": "lunch", "emoji": "🍲", "name": "Обіди" },
        "cuisine": { "id": "…", "slug": "italian", "emoji": "🇮🇹", "name": "Італійська" },
        "diets": [{ "id": "…", "slug": "vegetarian", "emoji": "🌿", "name": "Вегетаріанська" }],
        "ingredients": [
            { "id": "…", "productId": "…", "name": "Морква", "amountG": 200, "calories": 82, "proteinG": 1.8, "fatsG": 0.4, "carbsG": 19.2 }
        ],
        "steps": [
            { "id": "…", "stepNumber": 1, "title": "Підготовка овочів", "description": "…", "durationMinutes": 5 }
        ]
    }
}
```

**Деталь — це картка каталогу плюс те, що за нею.** Той самий обʼєкт
розширено, а не описано вдруге: окрема форма розійшлася б із карткою при
першій же зміні.

**Обидва набори чисел названі.** Зведення показує всю страву (FR-002),
картка й фільтр — порцію; поля `total` і `perServing` знімають питання, які
саме «ккал» тримає клієнт. `perServing` виводиться з `total / servings` в
сутності — одне визначення на всі поверхні.

**Внесок інгредієнта рахує сервер.** Рядок складу показує Б/Ж/В і вагу
(FR-004), а це `product.<макрос> × amount_g / 100` — та сама формула, з якої
ADR-0006 виводить КБЖВ власної страви. Клієнт, який рахував би сам, потребував
би макросів кожного продукту в кожній відповіді каталогу.

**Кроки віддаються всі й по порядку** — нинішній дизайн (FR-005) друкує їх
однією карткою підряд. Порядок задає `step_number`, а не порядок рядків.

**Склад кроку окремо не передається.** Дизайн деталі показує інгредієнти
страви один раз над кроками; чипси «потрібні інгредієнти» є лише в
редакторі `create-dish`, і таблиця звʼязку зʼявиться разом із ним. Будувати
її зараз означало б випустити таблицю, яку ніхто не читає.

**`404` `catalog.recipe-not-found`** — однаково і для неіснуючої страви, і
для чужої власної.

### Улюблене (FR-011)

`PUT` / `DELETE /recipes/{id}/favorite`, обидва **204** і обидва
ідемпотентні — описано в [`../recipes-list/plan.md`](../recipes-list/plan.md).
Стан приходить у `isFavorite` тієї самої відповіді, тож каталог і деталь не
можуть розійтися.

### Шторка порцій (FR-007…FR-009)

Сервер участі не бере. Він віддає базову порцію (`perServing`) і кількість
порцій; масштабування степером має бути миттєвим і без звернень до мережі
(SC-002), а «порції для інших» впливають лише на загальну вагу — число, яке
клієнт складає з тих самих двох полів.

Записом того, що зʼїли, займається `POST /nutrition/meals` з
[`../../nutrition/meal-logging/plan.md`](../../nutrition/meal-logging/plan.md):
там `portions` і `eatenFraction` уже є, і саме там частка, зʼїдена іншими,
не потрапляє в статистику.

## Environment variables

Власних не додає.

## File structure

```
apps/client-api/src/modules/catalog/recipe.controller.ts   # GET /recipes/:id
apps/client-api/src/modules/catalog/recipe.service.ts      # detail()
apps/client-api/src/modules/catalog/dto/outbound/recipe.view.ts
packages/database/src/entities/recipe.entity.ts            # per-serving, ingredient contribution
packages/database/src/repositories/recipe/recipe.repository.ts
```

## Shared contract

- `@dns/shared-types` — `ContentSource`.
- `@dns/validation` — `recipeIdParamSchema`.

## Security & edge cases

- Ідентифікатор валідується як `uuid` схемою: без цього `/recipes/anything`
  дійшов би до запиту й повернув 404 замість 422.
- Видимість перевіряється в тому ж `WHERE`, що й читання, а не окремою
  перевіркою після нього.
- Страва без назви в жодній з двох мов не віддається — краще 404, ніж
  безіменна картка.
- Округлення внеску інгредієнта — один знак після коми, в сутності. Числа
  на екрані цілі, але заокруглювати до цілих тут означало б втратити
  щіпку спецій.
- `servings = 0` (такого не має бути, колонка NOT NULL з дефолтом 1)
  трактується як одна порція: тиха `Infinity` в калорійності гірша за це.

## Verification

- `apps/client-api/test/catalog.db-spec.ts` — внесок інгредієнта від ваги
  (200 г моркви = 82 ккал, 19.2 г вуглеводів), кроки по порядку з описом,
  названа кухня і дієти, чужа власна страва → 404, `perServing` дорівнює
  `total / servings`.

## Що ще не побудовано

- **FR-006 («Додати до раціону» / «Відмітити прийом їжі»)** — виклик уже
  існує (`POST /nutrition/meals`), але вибір прийому і кількості порцій —
  відкрите питання специфікації; пікер плану чекає на домен `meal-plan`.
- **«Додати до списку продуктів»** — домен `shopping-list`, і сама
  наявність кнопки у новому дизайні під питанням (відкрите питання
  специфікації).
- **FR-010 (режим покрокового приготування)** — окрема фіча, дизайну немає.
- **Редагування власної страви** — `create-dish` наступним зрізом;
  каталожні рецепти клієнт не редагує взагалі.
- **Час у картці способу приготування** (відкрите питання: крок чи страва) —
  сервер віддає обидва: `cookTimeMinutes` страви і `durationMinutes` кроку.
- **Чипси «потрібні інгредієнти» на кроці** — таблиця звʼязку зʼявиться
  разом із редактором кроків.

## Related

- Spec: [./spec.md](./spec.md)
- Plan (каталог і схема): [../recipes-list/plan.md](../recipes-list/plan.md)
- Plan (пошук): [../recipe-search/plan.md](../recipe-search/plan.md)
- Plan (журнал харчування): [../../nutrition/meal-logging/plan.md](../../nutrition/meal-logging/plan.md)
- ADRs: [ADR-0004](../../../../adr/0004-client-api-url-conventions.md),
  [ADR-0006](../../../../adr/0006-products-absorb-ingredients.md)
