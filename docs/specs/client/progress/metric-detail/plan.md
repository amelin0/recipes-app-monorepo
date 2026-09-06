---
spec: ./spec.md
status: Implemented
owner: '@amelin0'
created: 2026-09-06
updated: 2026-09-06
related-adrs: [ADR-0004, ADR-0007]
related-runbooks: []
---

# Plan: Metric detail (Детальний екран показника)

## Summary

FR-002, FR-002a, FR-003, FR-004, FR-005, FR-008, FR-009, FR-010 — серверна
частина: один ендпоінт `GET /progress/metrics/{metric}`, який віддає ту саму
картку, що й огляд, плюс зведення за період і різницю до цілі. FR-001,
FR-005a, FR-011 клієнтські (навігація з картки, підпис точок талії кольором,
перемикач КБЖВ). FR-006 і FR-007 ведуть у
[`../metric-logging/plan.md`](../metric-logging/plan.md).

Власних таблиць не додає — читає `body_measurements`
([../metrics-overview/plan.md](../metrics-overview/plan.md)), денні підсумки
харчування і `nutrition_goals`.

## Database

Змін немає.

## API contract

### `GET /progress/metrics/{metric}?days=30`

**Auth:** `JwtGuard`

`metric` — один із девʼяти: `weight`, `waist`, `height`, `water`, `steps`,
`calories`, `protein`, `fats`, `carbs`. Невідоме значення → `422`.

**Response 200 (разовий показник):**

```json
{
    "data": {
        "card": {
            "metric": "weight",
            "kind": "one-off",
            "unit": "kg",
            "current": 82.5,
            "initial": 84,
            "goal": 75,
            "recommendedMax": null,
            "points": [{ "id": "…", "date": "2026-09-06", "value": 82.5, "target": null, "outcome": null }]
        },
        "summary": {
            "min": 82.5,
            "avg": 83.2,
            "max": 84,
            "daysUnder": null,
            "daysOnTarget": null,
            "daysOver": null,
            "lowerBound": null,
            "upperBound": null
        },
        "difference": 7.5
    }
}
```

**Response 200 (щоденний показник):**

```json
{
    "data": {
        "card": { "metric": "water", "kind": "daily", "unit": "ml", "current": 2400, "goal": 2500, "points": [] },
        "summary": {
            "min": null,
            "avg": null,
            "max": null,
            "daysUnder": 3,
            "daysOnTarget": 1,
            "daysOver": 0,
            "lowerBound": 2250,
            "upperBound": 2750
        },
        "difference": -100
    }
}
```

**Картка — той самий обʼєкт, що й в огляді.** Екран показника — це та сама
картка, розгорнута; окрема форма означала б два описи одного і того ж, які
розходяться при першій же зміні.

**Зведення відповідає на різні питання для різних видів показника.**
Разовий питає «наскільки високо, наскільки низько, як зазвичай» (FR-004);
щоденний — «скільки днів я влучив». Це не одне зведення з різними полями, а
два, і `kind` картки каже, яке саме заповнене. Спроба звести їх до
`min/avg/max` дала б «середню кількість води за день» — число, яке нічого не
означає поруч із ціллю.

**`lowerBound` / `upperBound` віддаються разом із розподілом.** Інакше
підпис «в межах норми» на екрані довелося б обчислювати клієнту, і допуск
опинився б у двох місцях (див. `DAILY_TARGET_TOLERANCE` в
[ADR-0007](../../../../adr/0007-daily-norm-formulas.md)).

**`difference` — це `current − goal`, зі знаком.** Мінус означає «ще нижче
цілі», плюс — «вище»; напрямок, у якому це добре, залежить від показника і
лишається інтерпретацією клієнта. `null`, коли цілі або поточного значення
немає, — щоб екран не показував «−82.5 кг до цілі» акаунту без цілі.

**`summary: null`, коли за період нічого немає.** Нуль тут виглядав би як
виміряне значення.

**Список записів (FR-008…FR-010) — це `points` картки.** Окремий масив
записів поруч із точками графіка був би тим самим набором даних у двох
формах.

## Environment variables

Власних не додає.

## File structure

```
apps/client-api/src/modules/progress/progress.controller.ts     # GET /progress/metrics/:metric
apps/client-api/src/modules/progress/progress.service.ts        # detail(), summarise(), distribution()
apps/client-api/src/modules/progress/dto/inbound/metric.param.ts
apps/client-api/src/modules/progress/dto/outbound/progress-card.view.ts
```

## Shared contract

- `@dns/shared-types` — `ProgressMetric`, `MetricKind`, `DailyOutcome`.
- `@dns/validation` — `progressMetricParamSchema`, `progressWindowSchema`.
- `@dns/constants` — `DAILY_TARGET_TOLERANCE`.

## Security & edge cases

- Показник у шляху валідується схемою, а не рядковим порівнянням у сервісі:
  без цього `/progress/metrics/anything` мовчки повернув би порожню картку.
- Зведення рахується з тих самих точок, що й графік, — цифра під графіком
  не може розійтися з графіком.
- Порядок точок: репозиторій віддає виміри найновішими вперед (це порядок
  списку записів, FR-008), а картка розвертає їх для графіка. Обидва порядки
  потрібні, і жоден не виводиться з іншого на клієнті.

## Verification

- `apps/client-api/test/progress.db-spec.ts` — зведення разового показника
  (min/avg/max), розподіл днів проти цілі, день усередині допуску як
  «в нормі», відстань до цільової ваги, макрос читається з логу харчування,
  порожній період не дає зведення.
- Смоук: `GET /progress/metrics/protein?days=2` віддає `kind: daily`,
  одиницю `g` і ціль з `nutrition_goals`.

## Що ще не побудовано

- **FR-005a (підпис точок талії)** — сервер віддає `recommendedMax`;
  розфарбування точок нижче/вище межі робить клієнт.
- **FR-011 (перемикач КБЖВ)** реалізується чотирма запитами до
  `calories|protein|fats|carbs` або одним до огляду; окремого «комбінованого»
  ендпоінта навмисно немає, доки не стане видно, що клієнту заважає.
- **Звідки беруться межі норми КБЖВ** — відкрите питання специфікації,
  закрите інженерно допуском ±10 % (див. ADR-0007).

## Related

- Spec: [./spec.md](./spec.md)
- Plan (огляд): [../metrics-overview/plan.md](../metrics-overview/plan.md)
- Plan (запис виміру і ціль): [../metric-logging/plan.md](../metric-logging/plan.md)
- ADRs: [ADR-0004](../../../../adr/0004-client-api-url-conventions.md),
  [ADR-0007](../../../../adr/0007-daily-norm-formulas.md)
