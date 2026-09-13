---
title: Налаштувати App Store Connect, RevenueCat і вебхук підписок
severity: medium
owner: '@amelin0'
last-tested: null
---

# Налаштувати App Store Connect, RevenueCat і вебхук підписок

> Ще не проходили. Написано 2026-09-13 по документації Apple і RevenueCat
> (ADR-0009); після першого прогону поставити `last-tested` і виправити те,
> що в дашбордах виявилось не там. Кроки, які документація не підтверджує
> дослівно, позначені «(звірити)».

## When to use this

- Перед першою покупкою в пісочниці: без кроків A1–A2 і B2 жодна покупка
  через `react-native-purchases` не запишеться, а SDK мовчки віддасть
  порожні offerings.
- Перед першим сабмітом версії з пейволом (крок F): перша підписка і її
  група йдуть в App Review лише разом із версією застосунку.
- Коли ротуємо секрети RevenueCat (крок B7, B8) або переносимо бекенд на
  іншу адресу (крок B8).

Порядок важливий: Apple → RevenueCat → сервер → застосунок. Контракт
бекенду — `TODO_BE.md` §10.

## Prerequisites

- Роль **Account Holder** в Apple Developer (Paid Apps Agreement, In-App
  Purchase Key) — це не делегується.
- Доступ **Admin** до проєкту RevenueCat — і в Олега теж (секретний ключ,
  вебхук).
- Сховище секретів команди: `.p8` дається завантажити один раз, HMAC-секрет
  вебхука показується один раз.
- Задеплоєний `POST /api/v1/webhooks/revenuecat` (крок C) — до кроку B8.
- Остаточні **Product ID** (незмінні назавжди, не переюзати; пропозиція
  `rationfit_pro_annual` / `rationfit_pro_monthly` — рішення власника) і
  назва entitlement (`pro`).

## Steps

### A. App Store Connect

1. **Business → Agreements, Tax, and Banking.** Account Holder підписує
   Paid Apps Agreement, заповнює банк і податки. Доки статус банку не
   «Clear», sandbox-покупки не проходять.
2. **Users and Access → Integrations → In-App Purchase → Generate In-App
   Purchase Key.** Назва «RationFit RevenueCat». Завантажити `.p8` (один
   раз!), записати **Key ID** і **Issuer ID** (угорі сторінки) у сховище.
   Якщо Issuer ID не показано — спершу створити App Store Connect API key
   у тій самій секції: Issuer ID у них однаковий.
   - 2б. **App-Specific Shared Secret** (App → App Information → Manage)
     потрібен лише для StoreKit 1, тобто для iOS 15 при deployment target
     15.1. Якщо власник підіймає target до 16.0 — пропустити; якщо ні —
     скопіювати і вставити в RevenueCat у налаштування App Store-app.
3. **Apps → RationFit → Monetization → Subscriptions → Create Subscription
   Group** «RationFit Premium». Додати Localization групи (uk, en) — без неї
   продукти не стануть submittable.
4. У групі — дві auto-renewable підписки з остаточними Product ID:
   - річна: Duration **1 Year**, Subscription Prices $59.99 (усі
     території);
   - місячна: **1 Month**, $9.99.
   Для кожної: Localization (Display Name ≤30, Description ≤45),
   Availability, Review Information — скріншот пейволу **1024×1024**
   PNG/JPG (обовʼязковий; видалити потім не можна). **Family Sharing —
   вимкнено** на обох: інакше пʼять акаунтів однієї родини «конвертують»
   реферальні коди без оплати.
5. Річна → Subscription Prices → View all Subscription pricing → **Set up
   Introductory Offer** → Free Trial → **1 Week** → усі території, без дати
   кінця. Offer не редагується — лише видалити й створити.
6. (Рекомендовано) **Billing Grace Period** → увімкнути (16 днів): невдале
   списання не гасить рядок у той самий день. Налаштування рівня
   застосунку в App Store Connect; місце в меню — звірити.
7. **Users and Access → Sandbox → Test Accounts**: 3–5 акаунтів на
   plus-адресах командної пошти (не наявні Apple ID; сторфронти UA і US).
   «Subscription Renewal Rate» лишити «every 5 minutes» (рік → 1 год); для
   демо власнику — окремий акаунт з «every hour».

### B. RevenueCat

1. **New Project «RationFit» → Add app → App Store** → Bundle ID
   `com.rationfit.application`. Скопіювати Public API key `appl_…` — це
   `EXPO_PUBLIC_REVENUECAT_IOS_KEY`.
2. **Project → Apps → RationFit (App Store) → In-app purchase key
   configuration**: завантажити `.p8` з A2, ввести Issuer ID, звірити Key
   ID. Без цього StoreKit 2 транзакції не записуються.
3. **Product catalog → Products → + New**: обидва Product ID з A4 (або
   Import from App Store Connect, якщо додатково налаштовано App Store
   Connect API key — опційно).
4. **Entitlements → + New** → identifier `pro` → Attach products: обидва.
   Це `REVENUECAT_ENTITLEMENT_ID`. (Розділ каталогу продуктів проєкту —
   точна назва меню: звірити.)
5. **Offerings → `default` → + New package**: `$rc_annual` → річний
   продукт, `$rc_monthly` → місячний → Make current. Метадані offering не
   потрібні — тексти і бейдж економії дає наш `GET /subscription/plans`.
6. **Restore behavior** (налаштування проєкту) — лишити «Transfer to new
   App User ID» (ADR-0009, Decision 6). Місце в меню — звірити.
7. **API keys → + New → Secret** — саме **v1** (`sk_…`), не v2: v2-ключ не
   працює для `GET /v1/subscribers`. Де саме створюється v1-ключ у
   поточному дашборді — звірити (для v2 це Project settings → API keys).
   Олегу як `REVENUECAT_SECRET_KEY`. Ніколи в застосунок; на сервері — без
   заголовка `X-Platform`.
8. **Project → Integrations → Webhooks → + New**: URL
   `https://<api-host>/api/v1/webhooks/revenuecat`; Authorization header —
   випадковий рядок ≥32 символи → `REVENUECAT_WEBHOOK_AUTH`; Environment:
   **Production + Sandbox**; App: all; Event types: all. Увімкнути підпис —
   секрет показується один раз → `REVENUECAT_WEBHOOK_SIGNING_SECRET`.
9. **Project → Apps → RationFit (App Store) → Apple Server to Server
   notification settings** → скопіювати URL → App Store Connect → Apps →
   RationFit → General → App Information → **App Store Server
   Notifications**: Production Server URL **і** Sandbox Server URL = цей
   URL, Version 2. Обидва поля обовʼязково: порожній Sandbox шле sandbox у
   Production. Поле «Apple Server Notification Forwarding URL» у RC лишити
   порожнім — сирі Apple-нотифікації нам не потрібні.

### C. Сервер (Олег, `TODO_BE.md` §10)

1. Env з §10.10 у `infra/prod/.env.prod` (і для client-api, і для
   воркера): `REVENUECAT_MODE=live`, `REVENUECAT_SECRET_KEY`,
   `REVENUECAT_WEBHOOK_AUTH`, `REVENUECAT_WEBHOOK_SIGNING_SECRET`,
   `REVENUECAT_ENTITLEMENT_ID=pro`, `REVENUECAT_ENTITLE_SANDBOX=true` (до
   релізу), три `JOBS_REVENUECAT_*_CRON`.
2. Деплой із `POST /webhooks/revenuecat` і задачами воркера — **до** кроку
   B8 (URL має бути публічний HTTPS; на стенді вебхука не буде).

### D. Застосунок

1. `pnpm add react-native-purchases` в `apps/mobile`; `cd ios && pod
   install`; повна перезбірка dev client (hot reload на старому бінарнику
   дає `Invariant Violation: new NativeEventEmitter()`). `expo prebuild` не
   запускати — перезапише ручні правки в `ios/`.
2. `EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_…` у `.env` **і** в оточенні
   Xcode-збірки для TestFlight — інакше бандл без ключа і мовчки без
   покупок. `test_`-ключ у TestFlight заборонений RC.

### E. Симулятор (опційно, лише UI)

1. Xcode → File → New → File → **StoreKit Configuration File** → Synced
   with App Store Connect → у дубльовану схему (Edit Scheme → Run → Options
   → StoreKit Configuration).
2. Editor → **Save Public Certificate** → завантажити сертифікат у
   RevenueCat, налаштування App Store-app (точна вкладка — звірити).
3. Запускати лише з Xcode: `expo run:ios`, `xcodebuild` і argent файл
   ігнорують. Сервер і вебхуки цей шлях не зачіпає — для них крок G.

### F. Перед першим сабмітом

1. App Store Connect → App Information: **EULA** (свій документ або
   стандартна Apple) і **Privacy Policy URL** заповнені; ті самі посилання —
   на пейволі (paywall FR-018).
2. Версія з пейволом іде в App Review **разом** із першою підпискою і групою
   (на продуктах → Add for Review → та сама версія). У Review Notes —
   sandbox-акаунт і що саме замкнено без підписки.

### G. Перевірка end-to-end

1. Фізичний iPhone, dev-збірка, Settings → Developer → **Sandbox Apple
   Account** = акаунт із A7. Купити річний план з пробним періодом.
2. Очікуємо: рядок у `revenuecat_events` (`INITIAL_PURCHASE`, `SANDBOX`),
   рядок `subscriptions` (`source=trial`, `environment=sandbox`),
   `GET /subscription` → `entitlement.isSubscribed=true`, замки зникли без
   перезапуску.
3. Через ~1 год (рік у пісочниці) — `RENEWAL`, `source=purchase`; через 12
   поновлень — `EXPIRATION`, замки повернулись.
4. Кнопка «Send test event» у B8 — очікуємо рядок `TEST` у
   `revenuecat_events` без інших змін.

### H. Після релізу

1. `REVENUECAT_ENTITLE_SANDBOX=false` у проді і **один прохід** по
   `subscriptions where environment = 'sandbox' and status = 'active'` —
   закрити з перенесенням (`TODO_BE.md` §10.4); звірка сама їх не зачепить,
   бо їхня дата далеко. Попередити тестерів заздалегідь.
2. У RevenueCat → Customers перевірити, що TestFlight-покупки позначені
   sandbox і не в Overview без перемикача «Sandbox data».

### I. Android (пізніше, але довгі строки — робити разом зі створенням
Play-застосунку)

Google Payments profile; Google Cloud → service account + JSON, увімкнути
Google Play Android Developer API, Play Developer Reporting API, Pub/Sub API;
Play Console → Users and permissions → service account із «View app
information and download bulk reports», «View financial data, orders, and
cancellation survey response», «Manage orders and subscriptions», «Manage
store presence» (до 36 год на активацію); RevenueCat → Add app → Play Store
→ `com.rationfit.application` → JSON → **Connect to Google** → Topic ID →
Play Console → Monetize → Monetization setup → Real-time developer
notifications → topic + «Subscriptions, voided purchases, and all one-time
products» → Send test notification. Продукти в Play створюються лише після
збірки з Billing Library на internal track; тестери — License testing +
opt-in URL.

## Verification

- `GET /subscription/plans` віддає `appleProductId`, що збігаються з A4;
  `Purchases.getOfferings()` у застосунку — два пакети з тими самими id.
- Крок G пройдено: три події (`INITIAL_PURCHASE`, `RENEWAL`, `EXPIRATION`)
  дійшли і змінили рядок так, як у таблиці §10.12.
- `TEST`-подія з дашборду лягла в `revenuecat_events` і нічого не змінила.

## Rollback

- Вебхук зламався (`401`/`5xx`): RC ретраїть 5 разів протягом ~2,6 год —
  час полагодити; далі події губляться, їх добере `revenuecat-reconcile`
  (≤30 хв після фіксу) або «Retry» на сторінці інтеграції.
- Ротація секретів вебхука: обидві змінні приймають список через кому —
  додати нове значення в env → деплой → змінити в дашборді → прибрати
  старе. `REVENUECAT_SECRET_KEY`: створити новий (два живуть паралельно) →
  деплой → відкликати старий; `401` від RC після ротації видно по
  `dns_revenuecat_auth_failures_total`.
- Помилковий product id у магазині: не видаляти (id згорає назавжди) —
  зняти з продажу і створити правильний; сід `subscription_plans` під нього.

## Postmortem hooks

- Покупка є в RevenueCat → Customers, а в нас доступу немає: подивитись
  `revenuecat_events` за `app_user_id` (чи дійшов вебхук, `error`), потім
  `POST /subscription/sync` від імені користувача — якщо після нього доступ
  зʼявився, проблема в доставці вебхуків, не в правилах.
- Оновити цей рунбук і `TODO_BE.md` §10, якщо інцидент показав розбіжність.
