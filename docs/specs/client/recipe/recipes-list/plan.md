---
spec: ./spec.md
status: Implemented
owner: '@amelin0'
created: 2026-09-07
updated: 2026-09-07
related-adrs: [ADR-0004, ADR-0006]
related-runbooks: []
---

# Plan: Recipes list (Вкладка «Рецепти» — каталог)

## Summary

FR-001, FR-003, FR-005, FR-008 і FR-009 — серверна частина: одна колекція
`GET /recipes`, звужена табом і фільтрами, картка з КБЖВ на порцію і
улюблене підресурсом. FR-002 (рейка категорій) живиться з
[`../recipe-filters/plan.md`](../recipe-filters/plan.md). FR-004
(сітка/список), FR-006 і FR-007 (чипси й лічильник на іконці) клієнтські —
це подання того самого набору фільтрів. FR-010 (плитка «додати рецепт») веде
у `create-dish`, якого ще немає.

Цей план несе схему всього домену; сусідні плани посилаються на неї.

**Ключове рішення домену: окремої таблиці інгредієнтів немає.** Склад рецепта
посилається на `products` — рядок, який несе КБЖВ на 100 г
([ADR-0006](../../../../adr/0006-products-absorb-ingredients.md)). Слово
«інгредієнт» лишається назвою ролі, а не сутності.

## Database

### Довідники фільтрів — чотири пари таблиць

| Таблиця                                                | Рядків | Що                                     |
| ------------------------------------------------------ | ------ | -------------------------------------- |
| `dish_categories` + `dish_category_translations`       | 11     | категорії страв, емодзі + ілюстрація   |
| `product_groups` + `product_group_translations`        | 6      | овочі, фрукти, мʼясо, риба, солодке, молочне |
| `cuisines` + `cuisine_translations`                    | 6      | кухні                                  |
| `diets` + `diet_translations`                          | 13     | дієти                                  |

Кожна несе `slug` (унікальний), `emoji`, `sort_order`; категорії додатково
`image_url`. Назви — в `*_translations` з композитним ключем
`(<entity>_id, language)`.

**Таблиці, а не енуми в коді.** Рецепт посилається на рядок, і таких рецептів
тисячі; дванадцята категорія не має вимагати релізу двох застосунків. Рядки
приїжджають **разом із міграцією**, тож свіжа база ніколи не показує
порожній екран фільтрів.

**`sort_order` зберігається, а не виводиться.** Порядок задає дизайн (солоні
сніданки перші, випічка остання), і алфавіт у кожній мові свій.

### `products` + `product_translations`

| Column                              | Type            | Опис                                    |
| ----------------------------------- | --------------- | --------------------------------------- |
| `id`                                | `uuid`          | PK                                      |
| `source`                            | `content_source`| `global` \| `custom`                    |
| `group_id`                          | `uuid`          | FK `product_groups`, ON DELETE SET NULL |
| `calories/protein/fats/carbs_per_100g` | `numeric(7,2)` | NOT NULL                             |
| `serving_weight_g`                  | `numeric(7,2)`  | вага типової порції                     |
| `is_quick_pick`                     | `boolean`       | 15 чипсів екрана фільтрів               |
| `is_verified`                       | `boolean`       |                                         |
| `created_by`                        | `uuid`          | FK `users`, **ON DELETE SET NULL**      |

`product_translations`: `(product_id, language)` PK, `name`, `serving_label`.

**«1 шт» лежить у перекладах, а вага — ні.** Підпис порції — слова, тож
живе поруч з іншими словами; число мовою не залежить.

**Власний продукт відчіпляється, а не зникає разом з автором.** Продукт,
який адмін верифікував або який лежить у чужому рецепті, перестав бути
персональними даними однієї людини; каскад спорожнив би той рецепт, нікому
про це не сказавши.

**Пʼятнадцять швидких продуктів приїжджають з міграцією.** Їх поіменно
називає `recipe-filters` FR-002, тобто вони частина продуктового контракту,
а не тестові дані. Значення КБЖВ узяті з USDA і є **стартовими** — повний
імпорт 272 продуктів окремою задачею.

### `recipes` + `recipe_translations`

| Column                          | Type             | Опис                             |
| ------------------------------- | ---------------- | -------------------------------- |
| `source`                        | `content_source` | каталожний чи власний            |
| `category_id`                   | `uuid`           | FK, ON DELETE SET NULL           |
| `cuisine_id`                    | `uuid`           | FK, **рівно одна**               |
| `photo_url`, `cook_time_minutes`| `text`, `integer`|                                  |
| `servings`                      | `integer`        | NOT NULL, default 1              |
| `total_weight_g`                | `numeric(8,2)`   |                                  |
| `calories`                      | `integer`        | **на всю страву**                |
| `protein_g` / `fats_g` / `carbs_g` | `numeric(7,2)` | на всю страву                   |
| `created_by`                    | `uuid`           | FK `users`, ON DELETE CASCADE    |

`recipe_translations`: `(recipe_id, language)` PK, `title`.

**КБЖВ зберігається, а не рахується з складу на кожному читанні.**
Каталожні рецепти приходять із авторськими числами, і частина їхніх
інгредієнтів досі без макросів (відкрите питання ADR-0006) — виведення на
читанні тихо занизило б саме ці страви. Власна страва отримає ті самі
колонки, заповнені сервером зі складу **під час запису**: порахували раз і
зафіксували, те саме правило, що й у журналі харчування.

**Числа описують усю страву; на порцію — це `total / servings`.** Так рахує
і картка, і фільтр калорійності, і шторка порцій. Зберігати обидва значення
означало б тримати один факт у двох місцях.

**Кухня — колонка, не звʼязок** (закрито відкрите питання ADR-0006).
Деталь називає одну кухню, форма створення дає обрати одну, а множинний
вибір у фільтрі — це OR, на який колонки достатньо.

### Склад, кроки, дієти, улюблене

- `recipe_ingredients` — `recipe_id`, `product_id` (**ON DELETE RESTRICT**),
  `amount_g`, `sort_order`.
- `recipe_steps` + `recipe_step_translations` — номер, тривалість; назва й
  опис у перекладах. Унікальність `(recipe_id, step_number)`.
- `recipe_diets` — багато-до-багатьох.
- `recipe_favorites` — `(user_id, recipe_id)` композитний PK.

**Тільки грами.** Кожен екран, що показує інгредієнт, показує вагу, а сума
макросів з ADR-0006 — це `Σ(per_100g × amount_g / 100)`. Колонка `unit`,
успадкована з V1, пустила б у таблицю «1 склянку» — рядок, макроси якого
ніхто не порахує, всередині страви, підсумки якої мають зійтися.

**`RESTRICT` на продукті складу.** Видалення продукту, з якого зроблені
страви, має впасти голосно, а не тихо їх спорожнити.

**Композитний ключ улюбленого — це і є ідемпотентність.** Подвійний тап на
поганому звʼязку не має лишити двох рядків, і саме тому маршрут — підресурс
`PUT`/`DELETE`, а не `toggle` (ADR-0004).

### Migrations

- `0006_colossal_khan.sql` — 17 таблиць, енум `content_source`, плюс
  довідникові рядки і 15 швидких продуктів у тій самій міграції.

## API contract

### `GET /recipes`

**Auth:** `JwtGuard`

| Param | Значення |
| --- | --- |
| `tab` | `all` (за замовчуванням) \| `favorite` \| `own` |
| `q` | підрядок назви, без чутливості до регістру |
| `categories`, `cuisines`, `diets` | id через кому або повтором параметра — **будь-який з обраних** |
| `products`, `productGroups` | те саме подання — **усі обрані** |
| `caloriesMin`, `caloriesMax` | на порцію; `800` = «800+», тобто без стелі |
| `page`, `limit` | 1 / 20, стеля 50 |

**Response 200:**

```json
{
    "data": [
        {
            "id": "…",
            "title": "Запечений лосось",
            "source": "global",
            "photoUrl": "https://…",
            "cookTimeMinutes": 25,
            "servings": 2,
            "perServing": { "calories": 450, "proteinG": 20, "fatsG": 10, "carbsG": 45, "weightG": 300 },
            "isFavorite": false
        }
    ],
    "meta": { "total": 128, "page": 1, "limit": 20, "totalPages": 7 }
}
```

**Таб — параметр запиту, а не власний шлях.** Це одна колекція, звужена
трьома способами (ADR-0004); `/recipes/favorites` був би другим описом тих
самих рядків.

**Фільтри діють на всіх табах.** Відкрите питання специфікації, закрите тут:
чипси лишаються на екрані й на «Улюблених», і лічильник на іконці фільтра
поруч із невідфільтрованою видачею був би брехнею.

**Окремого `/recipes/count` немає.** `meta.total` — це і є число під кнопкою
«Показати N результатів»; другий маршрут дав би числу під кнопкою шанс
розійтися зі списком за нею.

**Картка несе значення на порцію, деталь — обидва.** Класти обидва на картку
означало б лишити клієнта гадати, які саме «ккал» він тримає.

### `PUT` / `DELETE /recipes/{id}/favorite`

**204** обидва, обидва ідемпотентні. `404` `catalog.recipe-not-found` — і
коли страви немає, і коли вона чужа власна: одному акаунту не варто знати,
що в іншого щось є.

### `GET /products`

`?q=`, `?groupId=`, `?page=`, `?limit=` — секція «Інгредієнти» екрана пошуку
і пікер складу. Описано в [`../recipe-search/plan.md`](../recipe-search/plan.md).

## Environment variables

Власних не додає.

## File structure

```
apps/client-api/src/modules/catalog/recipe.controller.ts
apps/client-api/src/modules/catalog/recipe.service.ts
apps/client-api/src/modules/catalog/product.controller.ts
apps/client-api/src/modules/catalog/product.service.ts
apps/client-api/src/modules/catalog/reader-language.service.ts
apps/client-api/src/modules/catalog/catalog.errors.ts
apps/client-api/src/modules/catalog/dto/
packages/database/src/schema/{dish-categories,cuisines,diets,product-groups}.schema.ts
packages/database/src/schema/{products,recipes,recipe-ingredients,recipe-steps,recipe-diets,recipe-favorites}.schema.ts
packages/database/src/entities/{catalog-reference,product,recipe}.entity.ts
packages/database/src/repositories/{reference,product,recipe}/
packages/validation/src/catalog.schemas.ts
packages/constants/src/catalog.ts
packages/api-common/src/interceptors/paginated.ts
```

Рецепти й продукти — один модуль, бо ADR-0006 зробив їх одним доменом:
продукт у страві це інгредієнт цієї страви, екран пошуку показує обидва
поруч, і читаються вони однією мовою за одними правилами.

## Shared contract

- `@dns/shared-types` — `ContentSource`, `RecipeTab`, `PaginatedResponse`.
- `@dns/validation` — `recipeListQuerySchema`, `productSearchQuerySchema`,
  `createProductSchema`, `recipeIdParamSchema`.
- `@dns/constants` — `CATALOG_PAGE_SIZE`, `RECIPE_CALORIE_FILTER`,
  `DEFAULT_LANGUAGE`.
- `@dns/api-common` — `Paginated`: конверт `{ data, meta }`, який
  `ResponseInterceptor` віддає замість `{ data }`. Маркер-клас, а не
  вгадування форми — доменний обʼєкт із полем `meta` не має міняти
  серіалізацію.

## Security & edge cases

- Видимість — у кожному `WHERE`: каталожні рецепти плюс власні цього
  акаунта. Чужа власна страва не існує ні для читання, ні для улюбленого.
- `limit` має стелю 50: без неї один запит змусив би сервер зібрати весь
  каталог з усіма приєднаннями.
- Мова читача береться з `user_settings.language`, а не з заголовка: хто
  поставив польську, чекає її й на телефоні з англійською системою.
- **Рецепт без назви в жодній з двох мов відкидається в SQL**, а не
  показується безіменним — і відкидається там же, де рахується `meta.total`,
  щоб сторінка і підсумок рахували одні й ті самі рядки.
- Перекладу нема — береться українська (`DEFAULT_LANGUAGE`), потім `slug`.
  Зникнути з каталогу гірше, ніж показатися чужою мовою.
- `GET /recipes/filters` оголошено **до** `GET /recipes/{id}`: параметричний
  маршрут попереду проковтнув би «filters».

## Verification

- `apps/client-api/test/catalog.db-spec.ts` — 25 тестів: довідники, поділ на
  порції, фолбек мови, пошук підрядком, `meta.total` проти сторінки,
  видимість чужої страви, таби, пʼять груп фільтрів із їхньою семантикою,
  стеля «800+», улюблене й ідемпотентність, деталь із порахованим складом і
  кроками, продукти.
- Тестове очищення бази більше **не** використовує `TRUNCATE … CASCADE` на
  `users`: CASCADE ігнорує `ON DELETE` і забирав засіяні продукти з собою.
  `DELETE FROM users` дотримується правил — власні страви каскадують,
  користувацькі продукти відчіпляються, засіяне лишається.

## Що ще не побудовано

- **FR-004 (сітка/список)** і **FR-006/FR-007 (чипси, лічильник)** —
  подання одного набору фільтрів, цілком клієнтські.
- **FR-010 (плитка «додати рецепт»)** чекає на `create-dish` — запису
  рецептів ще немає; фікстури тестів пишуть у схему напряму.
- **Пагінація каталогу** (відкрите питання специфікації) вирішена як
  `page`/`limit` з `meta`; нескінченний скрол — рішення клієнта.
- **Undo після зняття улюбленого** — відкрите питання; сервер до нього
  готовий, бо `PUT` ідемпотентний.
- **Порядок сортування** — `createdAt` спадаючи; персоналізації немає, і
  специфікація її не вимагає.
- **Повнотекстовий пошук.** Збіг — `ILIKE '%…%'`, який жоден btree не
  обслуговує. Для нинішнього каталогу це скан; перед зростанням потрібен
  триграмний індекс (`pg_trgm`).

## Related

- Spec: [./spec.md](./spec.md)
- Plan (фільтри): [../recipe-filters/plan.md](../recipe-filters/plan.md)
- Plan (пошук): [../recipe-search/plan.md](../recipe-search/plan.md)
- Plan (деталі страви): [../meal-details/plan.md](../meal-details/plan.md)
- ADRs: [ADR-0004](../../../../adr/0004-client-api-url-conventions.md),
  [ADR-0006](../../../../adr/0006-products-absorb-ingredients.md)
