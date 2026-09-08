---
spec: ./spec.md
status: Implemented
owner: '@amelin0'
created: 2026-09-08
updated: 2026-09-08
related-adrs: [ADR-0002, ADR-0004, ADR-0006]
related-runbooks: []
---

# Plan: Product catalogue (Каталог продуктів)

## Summary

CRUD над наявними `products` / `product_translations` (FR-004…FR-007,
FR-010), CSV-імпорт (FR-001…FR-003) і одна нова колонка для прибирання без
видалення (FR-008, FR-009).

Чотири рішення власника продукту від 2026-09-08:

| Питання | Рішення |
|---|---|
| Що робить «верифікувати» | **Промоція**: `source → global`, `created_by → null` |
| Чи можна створювати продукти | **Так** — і форма, і CSV-імпорт |
| Видалення продукту зі страв | **Архівування**, не видалення |
| Набір quick-pick | **Редагується**, без ліміту |

## Database

### Зміна: `products.archived_at`

| Column | Type | Constraints |
|---|---|---|
| `archived_at` | `timestamptz` | NULL |

FR-008 неможливий інакше. `recipe_ingredients` посилається на продукти через
`ON DELETE RESTRICT` — саме щоб видалення не спорожнило страву мовчки, — тож
«прибрати з каталогу» не може бути `DELETE`. Архівування лишає рядок на
місці: страви цілі, записи в щоденнику цілі, а з пошуку продукт зникає.

Індексу не додаємо: `archived_at is null` — умова з дуже низькою
селективністю (архівних одиниці на тисячі), і індекс по ній не
використовувався б.

⚠️ **Фільтр архівних має зʼявитися і в клієнтському репозиторії теж.**
`ProductRepository.search`, `findQuickPicks`, `findByIds` обслуговують
мобільний застосунок; без фільтра прибраний продукт і далі знаходився б у
пошуку — тобто FR-009 виконувався б лише в адмінці, що гірше за невиконання,
бо виглядало б зробленим.

### Migrations

- `0014_*.sql` — одна колонка.

## API contract

Базовий шлях `/api/v1`, конверт `{data}`, camelCase (ADR-0002/0004). Усі
маршрути під Bearer + ADMIN/SUPER_ADMIN (FR-012).

### `GET /api/v1/products`

Query: `search`, `source` (`global` | `custom`), `isVerified`, `isQuickPick`,
`includeArchived`, `language`, `page`, `limit`.

**Один ендпоінт на два вжитки.** Форма рецепта шукає ним же продукти для
складу — їй потрібні ті самі поля плюс макроси, щоб рахувати підсумок без
запиту на кожен інгредієнт. Тому `GET /products` **переїжджає** з модуля
`catalog` сюди: два майже однакові списки розійшлися б на першій же зміні.

```json
{ "id": "…", "name": "Помідори", "nameEn": "Tomatoes",
  "source": "global", "groupSlug": "vegetables",
  "caloriesPer100g": 18, "proteinPer100g": 0.9,
  "fatsPer100g": 0.2, "carbsPer100g": 3.9,
  "servingWeightG": 123, "isQuickPick": true, "isVerified": true,
  "createdBy": null, "archivedAt": null, "createdAt": "…" }
```

За замовчуванням архівні **не повертаються**.

### `GET /api/v1/products/:id`

Те саме плюс усі переклади — форма редагування показує кожну мову.

### `POST /api/v1/products` · `PUT /api/v1/products/:id`

```json
{ "groupSlug": "vegetables",
  "caloriesPer100g": 18, "proteinPer100g": 0.9,
  "fatsPer100g": 0.2, "carbsPer100g": 3.9,
  "servingWeightG": 123,
  "isQuickPick": false,
  "translations": [ { "language": "uk", "name": "Помідори", "servingLabel": "1 шт" } ] }
```

| Field | Required | Validation |
|---|---|---|
| `translations` | так | ≥1; `uk` обовʼязкова — вона фолбек у `coalesce` |
| макроси | так | ≥ 0; калорії ≤ 900 на 100 г |
| `servingWeightG` | ні | > 0 |
| `groupSlug` | ні | існує в `product_groups` |

Створене через форму — завжди `source: global`, `createdBy: null`: адмін
поповнює спільний каталог, а не заводить собі особистий продукт.

**Про верхню межу калорій.** 900 — це трохи більше за чистий жир (884), тобто
фізична стеля для їстівного на 100 г. Це не смакова перевірка, а захист від
одруківки на порядок: «огірок, 1600 ккал» зіпсує норму кожному, хто його
з'їв, і виявиться це нескоро (FR-011).

### `PATCH /api/v1/products/:id/verification`

`{ "isVerified": true }` → підтвердження **промотує** (рішення від
2026-09-08):

```
source: custom → global
created_by: <user> → null
is_verified: true
```

Незворотності тут немає, але зняття прапорця **не** повертає продукт автору:
`created_by` уже втрачено. Так і має бути — продукт, який побачили всі,
перестав бути чиїмись особистими даними, і повертати його у приватні означало
б забрати його з чужих страв.

### `PATCH /api/v1/products/:id/archive`

`{ "archived": true | false }` — прибрати чи повернути (FR-008, FR-009).

### `POST /api/v1/products/import`

`multipart/form-data`, поле `file`. Той самий підхід, що в рецептах:
транзакція на рядок, звіт `{created, updated, skipped, errors[]}`, `200`
навіть із помилками — частковий успіх це очікуваний результат.

Дедуплікація — за **англійською назвою**, бо саме нею на продукт посилається
імпорт рецептів (`Tomatoes:250`). Ключ природний, на відміну від рецептів, де
довелося вводити `import_key`: у продукта англійська назва і є ідентичністю.

## Формат CSV

| Колонка | Обовʼязкова | Приклад |
|---|---|---|
| `name_en` | так | `Tomatoes` |
| `name_uk` | так | `Помідори` |
| `group` | ні | `vegetables` |
| `calories` | так | `18` |
| `protein` | так | `0.9` |
| `fats` | так | `0.2` |
| `carbs` | так | `3.9` |
| `serving_weight_g` | ні | `123` |
| `serving_label_uk` | ні | `1 шт` |
| `serving_label_en` | ні | `1 medium` |
| `quick_pick` | ні | `true` |

Парсер CSV **перевикористовується** з домену рецептів — це той самий
RFC-4180 reader, і друга копія розійшлася б на першій правці.

## Environment variables

Нових немає. `IMPORT_MAX_ROWS` спільний із імпортом рецептів.

## File structure

```
packages/database/src/schema/products.schema.ts          # + archived_at
packages/database/src/migrations/0014_*.sql
packages/database/src/repositories/admin-product/
packages/database/src/repositories/product/product.repository.ts  # фільтр архівних

packages/validation/src/admin-product.schemas.ts

apps/admin-api/src/modules/product/
  product.controller.ts  product.service.ts  product.module.ts
  import/product-import.service.ts
apps/admin-api/src/modules/catalog/     # /products переїжджає звідси

apps/web/src/data/remote/domains/product/
apps/web/src/state/domains/product/
apps/web/src/view/product/
```

## Security & edge cases

- **Усі маршрути за роллю** (FR-012).
- **Промоція незворотна щодо авторства** — `created_by` втрачається. Це
  наслідок рішення, а не недогляд, і він задокументований вище.
- **Архівування не чіпає збережені числа страв.** Макроси страви пораховані
  на запис (ADR-0006), тож правка чи архівування продукту не переписує
  нічого заднім числом. Саме тому запис у щоденнику переживає будь-що.
- **Дублікати за назвою** ловить імпорт; форма їх **не** ловить — редактор,
  що свідомо заводить другий «Сир», може мати рацію (різна жирність). Але
  імпорт має бути передбачуваним.
- **Архівний продукт лишається доступним за прямим id** — інакше сторінка
  страви, що його містить, зламалася б.

## Rollout

- Feature flag: немає.
- Порядок: міграція → деплой admin-api → правки `apps/web` → Vercel-free
  публікація панелі (`publish-web.sh`).
- Клієнтський API змінюється **одним фільтром** — архівні зникають із пошуку.
  Це видима для користувача зміна, і вона навмисна (FR-009).

## Verification

- Unit: парсер CSV продуктів — межі макросів, відсутні колонки, дубль назви
  всередині файлу.
- DB-тести: створення й правка; промоція міняє `source` і `created_by`;
  архівування ховає з пошуку **і клієнтського, і адмінського**, але лишає
  страву цілою; повторний імпорт оновлює, а не дублює.
- Тест на межу: продукт із 1600 ккал відхиляється (FR-011).
- Смоук: наповнити каталог імпортом, потім імпортувати рецепт, чий інгредієнт
  щойно зʼявився — має пройти (SC-003).

## Related

- Spec: [./spec.md](./spec.md)
- ADRs: [ADR-0006](../../../../adr/0006-products-absorb-ingredients.md)
- Залежний зріз: [`admin/recipe/catalog`](../../recipe/catalog/plan.md)
