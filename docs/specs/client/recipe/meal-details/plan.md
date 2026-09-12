---
spec: ./spec.md
status: Implemented
owner: '@amelin0'
created: 2026-09-07
updated: 2026-09-11
related-adrs: [ADR-0004, ADR-0006]
related-runbooks: []
---

# Plan: Meal details (Деталі страви)

## Summary

FR-002, FR-004, FR-005 і FR-011 — серверна частина: один ендпоінт
`GET /recipes/{id}`, який віддає картку, обидва набори чисел (на порцію і
на всю страву), склад із порахованим внеском кожного інгредієнта і кроки
приготування разом з інгредієнтами кожного кроку. FR-001 і FR-003 клієнтські
(фото, таби). FR-007, FR-008, FR-009 — арифметика шторки порцій, теж
клієнтська: масштабування має бути миттєвим і без мережі (SC-002).

FR-006 обслуговують ендпоінти інших доменів, які вже існують: «+ Додати до
раціону» з пікера плану — `POST /meal-plan/days/{date}/items`, «Відмітити
прийом їжі» — `POST /nutrition/days/{date}/meals`. FR-010 веде в окрему фічу
(режим приготування), якої ще немає, — див. «Що ще не побудовано».

Власних таблиць не додає — читає схему з
[`../recipes-list/plan.md`](../recipes-list/plan.md) і звʼязок крок↔інгредієнт
з [`../create-dish/plan.md`](../create-dish/plan.md).

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
            { "id": "…", "stepNumber": 1, "title": "Підготовка овочів", "description": "…", "durationMinutes": 5, "ingredientIds": ["…"] }
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

**Інгредієнти кроку — id з власного `ingredients` страви, а не копія
рядків.** `ingredientIds` кроку вказує на позиції складу тієї самої відповіді,
тож назва, вага і Б/Ж/В інгредієнта лежать в одному місці, а крок лише
називає, які з них йому потрібні (FR-005, «перелік потрібних інгредієнтів»).
Звʼязок зберігає `recipe_step_ingredients`, яку додав редактор кроків
[`create-dish`](../create-dish/plan.md); у каталожних рецептів без розмітки
масив порожній.

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

Записом того, що зʼїли, займається `POST /nutrition/days/{date}/meals` з
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
- `apps/client-api/test/catalog.db-spec.ts`, блок `creating a dish` —
  інгредієнти кроку в деталі повертаються як id зі складу тієї самої страви.

## Що ще не побудовано

Серверна частина самого екрана закрита. Лишилося те, що належить іншим фічам
або чекає на продуктову відповідь:

- **FR-010 (режим покрокового приготування)** — окрема фіча, дизайну немає.
  Кнопка на цьому екрані поки нікуди не веде.
- **Редагування власної страви** — `PATCH /recipes/{id}` не збудовано:
  `create-dish` явно виносить його за межі. Кнопка «редагувати» з FR-001 є в
  макеті й поки веде в нікуди; каталожні рецепти клієнт не редагує взагалі.
- **«Додати до списку продуктів» зі страви** — `POST /shopping-list/items`
  додає по одному продукту; передачі всього складу страви одним запитом немає,
  бо кнопка зникла з нового дизайну (відкрите питання специфікації). Страва,
  що стоїть у плані, і так потрапляє в список через імпорт із плану.
- **Кількість порцій для «+ Додати до раціону»** — позиція плану означає одну
  порцію (див. [`../../meal-plan/plan/plan.md`](../../meal-plan/plan/plan.md));
  відкрите питання специфікації лише підтверджує це правило або змінює його.
- **Час у картці способу приготування** (відкрите питання: крок чи страва) —
  сервер віддає обидва: `cookTimeMinutes` страви і `durationMinutes` кроку.

## Related

- Spec: [./spec.md](./spec.md)
- Plan (каталог і схема): [../recipes-list/plan.md](../recipes-list/plan.md)
- Plan (пошук): [../recipe-search/plan.md](../recipe-search/plan.md)
- Plan (журнал харчування): [../../nutrition/meal-logging/plan.md](../../nutrition/meal-logging/plan.md)
- ADRs: [ADR-0004](../../../../adr/0004-client-api-url-conventions.md),
  [ADR-0006](../../../../adr/0006-products-absorb-ingredients.md)
