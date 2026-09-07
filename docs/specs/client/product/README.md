# Product (client)

Каталог продуктів: назва мовою читача, КБЖВ на 100 г, типова порція, група
(овочі / фрукти / мʼясо / риба / солодке / молочне) і власні продукти
користувача.

**Окремих специфікацій цей домен не має, і це навмисно.** Продукт не має
свого екрана: він зʼявляється як рядок у секції «Інгредієнти» пошуку
(`recipe/recipe-search` FR-001, FR-003), як чипс на екрані фільтрів
(`recipe/recipe-filters` FR-002) і як склад страви
(`recipe/meal-details` FR-004). Писати для нього окрему WHAT/WHY означало б
описати вимоги, яких продукт не висував.

Сутність одна на весь застосунок: `products` поглинули `ingredients`
([ADR-0006](../../../adr/0006-products-absorb-ingredients.md)), і «інгредієнт»
лишилось назвою ролі, а не таблиці.

## Specs

| Feature | Status | Owner | Updated |
|---|---|---|---|

Контракт `GET /products` і `POST /products` описано в
[`../recipe/recipe-search/plan.md`](../recipe/recipe-search/plan.md);
схему — в [`../recipe/recipes-list/plan.md`](../recipe/recipes-list/plan.md).

Картка продукту за тапом на інгредієнт дизайну ще не має — коли зʼявиться,
вона й буде першою специфікацією цього домену.

## Related

- Код: `apps/client-api/src/modules/catalog/product.controller.ts`
- Knowledge (V1, референс): [`.claude/knowledge/product/`](../../../../.claude/knowledge/product)
