# Subscription + referral — що реально збудовано (V2)

Реалізовано 2026-09-07. Плани:
[`paywall`](../../../docs/specs/client/subscription/paywall/plan.md),
[`referral`](../../../docs/specs/client/user/referral/plan.md).

V1 цього домену не мав — усе тут нове.

## Схема

```
subscription_plans        + subscription_plan_translations   2 плани з міграції
plan_features             + plan_feature_translations        5 можливостей
subscriptions             (чек: копії цін, id транзакції унікальний)
referral_codes            (один код на акаунт, назавжди)
referral_redemptions      (PK на тому, хто гасить)
profiles.paywall_seen_at  («Пропустити»)
```

Енуми: `billing_period`, `subscription_source`, `subscription_status`,
`purchase_store`.

**Плани в базі, а не в константах** — SC-003 вимагає міняти ціни без релізу.
Магазин лишається джерелом правди про списання й валюту; ці числа — те, що
пейвол малює, поки чекає на його шторку. Кожен план несе
`apple_product_id` і `google_product_id`.

**Відсотка економії немає в таблиці** — рахується з двох цін.

**Підписка копіює ціни**, як журнал харчування копіює зʼїдене: це чек.

**`unique (user_id) where status = 'active'`** — одна жива підписка на
акаунт, гарантована базою.

## Ендпоінти

| Method | Path                                  |
| ------ | ------------------------------------- |
| GET    | `/subscription/plans`                 |
| GET    | `/subscription`                       |
| PUT    | `/subscription/paywall/seen`          |
| POST   | `/subscription/receipt`               |
| GET    | `/subscription/referral-codes/{code}` |
| POST   | `/subscription/redemptions`           |
| GET    | `/profile/referral`                   |

Коди помилок: `subscription.receipt-already-used`,
`subscription.unknown-product`, `subscription.unknown-referral-code`,
`subscription.own-referral-code`, `subscription.already-redeemed`,
`subscription.already-subscribed`.

## Дві пастки, які вже виправлені

1. **Чек із минулим періодом** (відновлення простроченої підписки) валив
   сервіс: він створював рядок і читав його назад через `findActive`, фільтр
   якого цей рядок ховає. `create` тепер повертає записане.
2. **Прострочений рядок зі статусом `active`** назавжди блокував нову
   покупку через частковий унікальний індекс. `expireLapsed` підмітає такі
   рядки в момент покупки.

Обидві знайшли тести.

## Перевірка чека

`PurchasesService` у `@dns/api-infrastructure/purchases` — **шов, не
інтеграція**. Без `APPLE_PRIVATE_KEY` / `GOOGLE_SERVICE_ACCOUNT_JSON`
вмикається `allowUnverified`: чек читається як JSON і береться на віру, з
попередженням у лог. Та сама домовленість, що й зі stub-поштою та
`FakeOAuthVerifier`.

Формат чека для дева:

```json
{ "transactionId": "txn-1", "productId": "com.rationfit.application.annual",
  "startedAt": "…", "expiresAt": "…", "isTrial": false }
```

**Реальна верифікація не написана.** Перед релізом — обовʼязково.

## Реферали

Код постійний, карбується під час першого запиту `GET /profile/referral`.
Алфавіт без `0/O` і `1/I`. Погашення — одне на акаунт назавжди (PK на
`redeemer_user_id`), нагорода — місяць на місячному плані.

`invited` — усі, хто погасив; `converted` — ті з них, хто дійшов до
підписки. `monthsEarned = converted × 1`, рахується, а не зберігається.

**Нарахування винагороди тому, хто запросив, не побудовано** — обидві
специфікації виносять його за межі.

## Чого ще немає

- Керування підпискою після покупки: скасування, зміна плану, відновлення,
  історія.
- **Підписка ні на що не впливає** — жоден ендпоінт її не перевіряє, бо
  специфікація не описує, що перестає працювати без неї.
- Соціальний доказ (рейтинг, відгук) — таблиці немає.
- Сповіщення про підписку: тип `subscription` в енумі є, джерела немає.
