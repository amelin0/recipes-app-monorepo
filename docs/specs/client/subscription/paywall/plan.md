---
spec: ./spec.md
status: Approved
owner: '@amelin0'
created: 2026-09-07
updated: 2026-09-11
related-adrs: [ADR-0004]
related-runbooks: []
---

# Plan: Paywall (Оформлення підписки)

## Summary

FR-003…FR-015 — серверна частина: плани й можливості в базі, стан підписки
на сервері, чек із магазину, реферальний код. FR-001 і FR-002
(коли показати пейвол і чим підписати заголовок) клієнтські — імʼя, цільова
вага і норма калорій уже приходять із `GET /profile` і
`GET /profile/recommendations`.

Статус `Approved`, а не `Implemented`, і причина одна: **перевірку чека
проти Apple і Google не побудовано**. Усе інше в домені працює і покрите
тестами.

## Database

### Плани і можливості

`subscription_plans` — `slug`, `period` (`month` \| `year`), `price_cents`,
`full_price_cents`, `currency`, `trial_days`, `apple_product_id`,
`google_product_id`, `sort_order`, `is_default`, `is_active`.
Плюс `subscription_plan_translations` — назва плану мовою читача.

`plan_features` + `plan_feature_translations` — перелік того, що дає
підписка.

**Таблиця, а не константи** (закрито головне відкрите питання): SC-003 прямо
вимагає, щоб ціни й назви змінювалися без релізу застосунку, а бейдж
економії та «який план обраний за замовчуванням» магазин не знає взагалі.
Що саме буде списано і в якій валюті — усе одно вирішує магазин; ці числа
— те, що пейвол малює, поки чекає на його шторку.

**Відсотка економії в таблиці немає.** Це вартість місяця цього плану проти
місяця місячного, і збережений відсоток мав би шанс розійтися з двома
цінами, надрукованими поруч із ним.

**Один перелік можливостей на два екрани** — FR-003 вимагає однакового
складу на пейволі й на підтвердженні, і одна таблиця це і є.

### Підписка

`subscriptions` — `plan_id`, `source` (`purchase` \| `trial` \| `referral`),
`status`, `started_at`, `expires_at`, `price_paid_cents`, `full_price_cents`,
`currency`, `referral_code`, `store`, `store_transaction_id`.

**Ціни копіюються, а не читаються через план** — це чек (FR-013), і він має
казати сплачене й після того, як ціна плану зміниться. Те саме правило, що
й у журналі харчування.

**`store_transaction_id` унікальний.** Без цього чек, повторений на другому
акаунті, купив би другу підписку однією оплатою.

**Частковий унікальний індекс `subscriptions_one_active_per_user`** —
`unique (user_id) where status = 'active'`. Одна жива підписка на акаунт,
гарантована базою, а не перевіркою, яку сервіс мусить памʼятати зробити.

### Реферальні коди

`referral_codes` — один код на акаунт, назавжди: він потрапляє в
повідомлення і скріншоти, які переживуть будь-яку ротацію.

`referral_redemptions` — **первинний ключ на тому, хто гасить**. Це і є
правило: акаунт гасить один код, один раз, назавжди. Будь-що слабше
перетворює реферальну програму на спосіб ніколи не платити.

### `profiles.paywall_seen_at`

Тут, а не в домені підписки: це наступний крок тієї самої воронки, яку рядок
уже веде, а в того, хто пропустив, ніякої підписки немає, щоб на ній
повиснути.

### Migrations

- `0011_milky_hammerhead.sql` — 4 енуми, 6 таблиць, колонка на `profiles`,
  плюс **два плани і пʼять можливостей**.

**Сід — справжні числа з макета**, узяті з
`apps/mobile/src/view/subscription/subscription.constants.ts`, де стояв
`TODO: replace with the plans endpoint`: рік $59.99 (повна $119.88, 7 днів
пробного), місяць $9.99, і пʼять можливостей українською з файлу локалізації.
Ціни в застосунку вигадувати не довелося.

## API contract

### `GET /subscription/plans`

**Auth:** `JwtGuard`

```json
{
    "data": {
        "plans": [
            {
                "id": "…", "slug": "annual", "name": "Річний план", "period": "year",
                "priceCents": 5999, "fullPriceCents": 11988, "monthlyPriceCents": 500,
                "currency": "USD", "trialDays": 7, "savingsPercent": 50, "isDefault": true,
                "appleProductId": "com.rationfit.application.annual", "googleProductId": "rationfit_annual"
            }
        ],
        "features": [{ "id": "…", "slug": "recipes", "name": "Бібліотека з 2000+ рецептів" }]
    }
}
```

**Ціни в мінорних одиницях.** Гроші у float — це помилка округлення, яка
чекає на десятковий дріб.

### `GET /subscription`

`{ "subscription": … | null, "paywallPending": true }`.

**Стан на сервері, а не на пристрої** (FR-015) — інакше він не переїхав би
на другий телефон.

**`paywallPending` хибне і для того, хто вже підписаний.** Пейвол нема чого
показувати тому, кому нема чого продати (крайній випадок специфікації).

**Підписка з минулою датою віддається як `null`.** Правда — це дата, і
колонка статусу, якої ще ніхто не підмів, не має права видати людині
підписку, якої в неї немає.

### `PUT /subscription/paywall/seen`

**204.** Односторонній перемикач: «Пропустити» (FR-007).

### `POST /subscription/receipt`

`{ store, receipt, productId? }` → **201** з готовою підпискою.

**План визначає `productId` з магазину, а не тіло запиту.** Інакше можна
було б заплатити за місяць і попросити рік.

**Відповідь — сама підписка**, тож екран підтвердження недосяжний, доки
оплата не пройшла (FR-012).

- `400` `subscription.receipt-already-used` — чек уже купив підписку іншому
  акаунту. **Повтор на тому самому акаунті помилкою не є** — це клієнт
  повторює запит.
- `400` `subscription.unknown-product` — магазин назвав товар, якого сервер
  не продає.
- `400` `subscription.already-subscribed`.
- `503`, якщо перевірка чека не налаштована і stub вимкнено.

**Після запису покупки — місяць тому, хто запросив покупця** (referral
FR-006, з 2026-09-11), поза транзакцією покупки й після сповіщення: помилка
нарахування не ламає покупку, а повтор того самого чека повторює й
нарахування. Що вважається конверсією і як це зроблено ідемпотентним —
у [referral plan](../../user/referral/plan.md).

### `GET /subscription/referral-codes/{code}`

Що дає код, не витрачаючи його (FR-008): `{ code, freeMonths, planSlug }`.
`404` `subscription.unknown-referral-code`,
`400` `subscription.own-referral-code` / `subscription.already-redeemed`.

Код нормалізується схемою — обрізається й переводиться у верхній регістр,
тож « abc123 » і «ABC123» це один код (крайній випадок специфікації).

### `POST /subscription/redemptions`

Гасить код: місяць безкоштовно, без магазину. **201** з підпискою.

**Нагорода лягає на місячний план** (FR-009) — саме це показує дизайн. Код,
прикладений до річного, не має чого дати, і сказати це чесніше, ніж тихо
його знижити.

**Кінець періоду рахується календарно:** 31 січня плюс місяць — це 28 (29)
лютого, а не 3 березня (крайній випадок специфікації).

### `GET /profile/referral`

`{ code, invited, converted, monthsEarned }` — екран реферальної програми
(referral FR-001, FR-004).

**Під `/profile`, а не `/subscription`:** це властивість людини, а не того,
що вона купила, і в того, хто нічого не купував, код усе одно є.

**Код карбується під час першого запиту**, а не на реєстрації: більшість
акаунтів цей екран не відкриють, а код, якого ніхто не бачив, — це рядок,
якого ніхто не потребує.

## Environment variables

| Змінна | Що |
| --- | --- |
| `APPLE_BUNDLE_ID`, `APPLE_ISSUER_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` | App Store Server API |
| `GOOGLE_PACKAGE_NAME`, `GOOGLE_SERVICE_ACCOUNT_JSON` | Google Play Developer API |

Порожні — вмикається stub, який бере чек на віру. Та сама домовленість, що
й з `RESEND_API_KEY`: без ключів усе проходиться локально, а замінюється
рівно той крок, який потребує чужих серверів.

## File structure

```
apps/client-api/src/modules/subscription/subscription.controller.ts
apps/client-api/src/modules/subscription/referral.controller.ts
apps/client-api/src/modules/subscription/subscription.service.ts
apps/client-api/src/modules/subscription/subscription.errors.ts
apps/client-api/src/common/config/purchases.config.ts
packages/api-infrastructure/src/purchases/            # PurchasesModule, stub verifier
packages/database/src/schema/subscriptions.schema.ts
packages/database/src/entities/subscription.entity.ts
packages/database/src/repositories/subscription/
packages/validation/src/subscription.schemas.ts
packages/constants/src/subscription.ts
```

## Shared contract

- `@dns/shared-types` — `BillingPeriod`, `SubscriptionSource`,
  `SubscriptionStatus`, `PurchaseStore`.
- `@dns/validation` — `submitReceiptSchema`, `redeemReferralSchema`,
  `referralCodeSchema`.
- `@dns/constants` — `REFERRAL_REWARD`, `REFERRAL_CODE_LENGTH`.

## Security & edge cases

- Чек ніколи не визначає план — лише магазин через `productId`.
- Повторення чека на другому акаунті відхиляється; на тому самому —
  ідемпотентне.
- Прострочені рядки підмітаються в момент покупки, а не нічним завданням.
  **Це не косметика:** база дозволяє один активний рядок на акаунт, і
  прострочена підписка, позначена активною, назавжди заблокувала б покупку,
  що мала її замінити. Знайдено тестом.
- `create` повертає записаний рядок, а не шукає його потім через
  `findActive`: чек із періодом, що вже минув, створює рядок, який цей
  фільтр навмисно ховає, і сервіс вирішував би, що вставка не вдалася.
  Теж знайдено тестом.
- Код не можна погасити власний, і не можна погасити другий.
- Алфавіт коду без `0/O` і `1/I` — коди диктують уголос і набирають руками.

## Verification

- `apps/client-api/test/subscription.db-spec.ts` — 20 тестів: обидва плани з
  порахованим бейджем, перелік можливостей, пейвол до і після «Пропустити»,
  покупка, план із `productId`, пробний період без списання, невідомий
  товар, чек на чужому акаунті, повтор на своєму, друга підписка, минула
  підписка як відсутня, покупка після завершення, карбування коду, опис без
  витрати, нормалізація, місяць у подарунок, лічильники реферала, свій і
  невідомий код, одне погашення на акаунт.

## Що ще не побудовано

- **Перевірка чека проти Apple і Google.** Потребує ключа App Store Connect
  і service-акаунта Google; код, написаний проти облікових даних, яких
  немає, неможливо запустити, тож замість неперевіреної інтеграції тут шов і
  stub. Перед релізом — обовʼязково.
- **Керування підпискою після покупки** (скасування, зміна плану,
  відновлення покупок, історія) — поза обсягом специфікації.
- **Обмеження безкоштовного режиму** — що саме перестає працювати без
  підписки, специфікація не описує, і жоден ендпоінт цього не перевіряє.
  Підписка зараз ні на що не впливає, крім власного екрана.
- **Соціальний доказ** (рейтинг, відгук) — маркетинговий контент; таблиці
  для нього немає, бо специфікація не каже, хто його редагує.
- **Пробний період: кому він доступний** (відкрите питання) вирішує магазин;
  сервер лише вірить тому, що каже чек.
- **Повторний показ пейволу** і кампанії повернення — поза обсягом.

## Related

- Spec: [./spec.md](./spec.md)
- Spec (реферальна програма): [../../user/referral/spec.md](../../user/referral/spec.md)
- Plan (анкета): [../../onboarding/profile-setup/plan.md](../../onboarding/profile-setup/plan.md)
- ADRs: [ADR-0004](../../../../adr/0004-client-api-url-conventions.md)
