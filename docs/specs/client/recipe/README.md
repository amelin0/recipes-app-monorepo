# Recipe (client)

Каталог рецептів мобільного застосунку: вкладка «Рецепти» з табами
Всі/Улюблені/Власні, популярними категоріями і перемикачем вигляду
сітка/список; шторка фільтрів (енергетична цінність однієї порції +
категорії, страви, спосіб приготування, дієти, інгредієнти); пошук
інгредієнтів і страв з режимом категорії; деталі страви з
інгредієнтами, кроками приготування та вибором порцій перед
готуванням (порції «для інших» не впливають на КБЖВ).

Кожна фіча живе у власній папці зі `spec.md` (+ `plan.md`, коли
бекенд бере фічу в роботу).

UI всіх екранів уже реалізовано в мобільному застосунку на мокових
даних (дизайн: Figma RF-mobile-app) — специфікації фіксують
продуктовий контракт для бекенда.

## Specs

| Feature | Status | Owner | Updated |
|---|---|---|---|
| [Recipes list (Вкладка «Рецепти»)](./recipes-list/spec.md) | Implemented | @amelin0 | 2026-09-07 |
| [Recipe filters (Фільтри)](./recipe-filters/spec.md) | Implemented | @amelin0 | 2026-09-07 |
| [Recipe search (Пошук)](./recipe-search/spec.md) | Implemented | @amelin0 | 2026-09-07 |
| [Meal details (Деталі страви + порції)](./meal-details/spec.md) | Implemented | @amelin0 | 2026-09-11 |
| [Create dish (Додати страву)](./create-dish/spec.md) | Implemented | @amelin0 | 2026-09-07 |

## Related

- Код (UI, мок-дані): `apps/mobile/src/view/recipe/`
- Код (API): `apps/client-api/src/modules/catalog/` — рецепти й продукти
  один модуль, бо [ADR-0006](../../../adr/0006-products-absorb-ingredients.md)
  зробив їх одним доменом
- Knowledge (контракти V1, референс): [`.claude/knowledge/recipe/`](../../../../.claude/knowledge/recipe)
