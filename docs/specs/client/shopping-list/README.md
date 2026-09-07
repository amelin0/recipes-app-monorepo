# Shopping List (client)

Список продуктів на тиждень: авто-імпорт продуктів з плану харчування
(перемикач «Додати з плану»), групування за категоріями (М'ясні, Мучні,
Молочні…), відмічання куплених позицій, ручне додавання з каталогу з
вибором кількості (Порція / Штука / Грам) і бейдж кількості на табі
«Список».

Кожна фіча живе у власній папці зі `spec.md` (+ `plan.md`, коли бекенд
бере фічу в роботу).

UI екранів уже реалізовано в мобільному застосунку з мок-даними
(дизайн: Figma RF-mobile-app) — специфікації фіксують продуктовий
контракт для бекенда.

## Specs

| Feature | Status | Owner | Updated |
|---|---|---|---|
| [Weekly list (Список продуктів)](./weekly-list/spec.md) | Implemented | @amelin0 | 2026-09-07 |
| [Add product (Додати продукт)](./add-product/spec.md) | Implemented | @amelin0 | 2026-09-07 |

## Related

- Код (UI, мок-дані): `apps/mobile/src/view/shopping-list/`
- Код (API): `apps/client-api/src/modules/shopping-list/`
- Knowledge (контракти V1, референс): [`.claude/knowledge/shopping-list/`](../../../../.claude/knowledge/shopping-list)
