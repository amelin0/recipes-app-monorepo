# TODO для бекенду

> Три теми. **§1–§8** — норми КБЖВ і вода: власник задав формули 12.09.2026,
> поточна реалізація в `packages/constants/src/nutrition-formulas.ts`
> відрізняється від них у чотирьох місцях, а історична цілісність норм
> вимагає зміни схеми. **§9** — замки безкоштовного режиму (макети
> 13.09): `docs/specs/client/subscription/free-tier/spec.md` і девʼять спек,
> що на неї посилаються. **§10** — оплата через RevenueCat (рішення
> власника 13.09): ADR-0009, рунбук `docs/runbooks/configure-revenuecat.md`.
> **§11** — зведений перелік робіт у порядку залежностей.
>
> **Бекенд змінює Олег.** Цей файл — контракт, а не зроблена робота:
> мобільний застосунок нічого з переліченого не чіпав, лише описав.
> Мобільна частина RevenueCat — `TODO_FE_RC.md`.
>
> Спеки оновлені: `docs/specs/client/onboarding/profile-setup/spec.md`
> (FR-006h) і `docs/specs/client/nutrition/goal-setup/spec.md` (FR-010…FR-013);
> `subscription/paywall` (US5, FR-016…FR-019), `subscription/free-tier`,
> `recipe/recipes-list`, `recipe/create-dish`, `recipe/meal-details`,
> `recipe/recipe-search`, `meal-plan/plan`, `shopping-list/weekly-list`,
> `progress/metrics-overview`, `progress/metric-detail`.

**Останнє оновлення:** 2026-09-13

## 1. Коефіцієнт активності — таблиця, не пряма

`activityMultiplier()` зараз інтерполює 1.2…1.9 рівно по восьми рівнях і
дає 1.2 / 1.3 / 1.4 / 1.5 / 1.6 / 1.7 / 1.8 / 1.9.

Треба взяти опубліковані коефіцієнти:

| Рівень | Опис | PAL |
| --- | --- | --- |
| 1 | без тренувань | 1.2 |
| 2 | 1 тренування/тиж | 1.3 |
| 3 | 2 тренування/тиж | 1.375 |
| 4 | 3 тренування/тиж | 1.45 |
| 5 | 4 тренування/тиж | 1.5 |
| 6 | 5 тренувань/тиж | 1.55 |
| 7 | 6–7 тренувань/тиж | 1.725 |
| 8 | фізпраця + тренування, або 2 тренування/день | 1.9 |

Різниця не косметична: рівні 3–7 зараз завищені або занижені на 0.05–0.15,
що на TDEE 2000 ккал дає 100–300 ккал похибки.

BMR лишається як є — Міффліна-Сан Жеора, `10×вага + 6.25×зріст − 5×вік + K`,
K = +5 для чоловіка, −161 для жінки. Це вже правильно.

Ціль множиться на TDEE: схуднення ×0.85, підтримка ×1.0, набір ×1.1 —
теж уже правильно.

## 2. Вода — від ваги й активності, трьома щаблями

Зараз: `вага × 30 + (рівень − 1) × 150`.

Треба:

| Активність | Формула |
| --- | --- |
| низька | вага × 30 мл |
| середня | вага × 35 мл |
| висока | вага × 40 мл |

**Потребує рішення власника:** три щаблі проти восьми рівнів слайдера.
Мобільний застосунок читає це так — низька 1–3 (до двох тренувань),
середня 4–6 (три-пʼять), висока 7–8 (шість і більше, фізпраця). Якщо
межі інші — це один рядок.

## 3. Макроси — від ваги, а не часткою калорій

Зараз `macroTargetsFor(calories, goal)` ділить калорії у відсотках, різних
для кожної цілі.

Треба:

- Білок = вага × 1.8 г
- Жир = вага × 1.0 г
- Вуглеводи = (калорії − білок×4 − жир×9) ÷ 4

Тобто білок і жир однакові для всіх трьох цілей — вони від тіла, а не від
цілі; ціль рухає лише вуглеводи, які добирають до потрібної калорійності.
Власник окремо зазначив, що це задумано, а не помилка.

Сигнатура має взяти вагу: `macroTargetsFor(calories, weightKg)`. Ціль більше
не потрібна.

Крайній випадок: на малій калорійності й великій вазі вуглеводи виходять
відʼємні. Клямп у нуль на боці формули; від того, щоб таке взагалі
траплялось, захищає діапазон із §4.

Клітковина (14 г / 1000 ккал) лишається — про неї вказівок не було.

## 4. Діапазон ±600 ккал

Від автоматично розрахованої норми — коридор ±600 ккал. Нижче або вище —
смужка червона, бо це вже забагато.

Потрібно:

- константа в `@dns/constants` (щоб застосунок і сервер мали одну);
- у `GET /profile/recommendations` віддавати межі разом із нормою, або
  клієнт рахуватиме їх сам із `calories` — достатньо, щоб константа була
  спільною;
- валідація на `POST /profile/onboarding/complete` і `PUT/PATCH
  /nutrition/goal`: значення поза коридором приймати, але це має бути
  свідомий вибір користувача — на клієнті він уже бачить попередження.
  **Потребує рішення:** попередження чи заборона. Зараз застосунок лише
  попереджає.

Чинна константа на клієнті — `CALORIE_WARNING_RATIO = 0.2` (відсоток).
Відсоток тут неправильний: 20 % від 1500 і 20 % від 3000 — різна шкода,
а тілу болить сам дефіцит, не його частка.

**Видно в застосунку просто зараз.** Екрани цілі попереджають за ±600
(константа клієнта), а `GET /progress/metrics/calories` віддає
`lowerBound`/`upperBound` як ±10 %: при нормі 1 900 екран деталей КБЖВ пише
«Мінімальна норма <1 710» і «Максимальна норма >2 090», тоді як анкета
червоніє лише нижче 1 300. Дві різні мірки на двох сусідніх екранах —
клієнт не може вирівняти їх сам, бо `outcome` кожного дня (колір стовпчика)
теж рахує сервер.

## 5. Перерахунок при зміні даних

Коли змінюється вага або рівень активності, норма КБЖВ має перерахуватись.
Інакше норма не відповідає тілу: скинула 3 кг — витрати впали, стара цифра
вже не дає дефіциту, результат зупиняється.

Тригери:

- `POST /progress/metrics/weight/measurements` — нове зважування;
- `PUT /profile/onboarding` з `weightKg` або `activityLevel`;
- майбутній екран зміни активності.

## 6. Історія норм — найбільша зміна

**Правило:** кожен день порівнюється з нормою того періоду, до якого він
належить, а не з поточною нормою з профілю.

Інакше: 5 липня людина зʼїла 2150 при нормі 2200 — день зелений. Норма
змінилась на 2100, і той самий день заднім числом став червоним. Їжа та
сама, мірка інша. Виглядає як баг.

### Схема

`nutrition_goals` зараз — один рядок на акаунт (`userId` як PK), і в
коментарі прямо сказано, що історія змін не потрібна. Тепер потрібна.

Потрібен періодний вигляд:

- `id` як PK;
- `startDate` (date, NOT NULL) — з якого дня діє;
- `endDate` (date, NULL) — по який; `NULL` = чинний період;
- унікальність `(userId)` там, де `endDate IS NULL` — чинний період один;
- унікальність `(userId, startDate)`.

Збереження цілі закриває поточний період (`endDate` = вчора) і відкриває
новий з сьогодні. Якщо чинний період уже почався сьогодні — оновити його
на місці: інакше людина, що двічі посунула повзунок за ранок, створить
два періоди.

### Наслідки в API

- `GET /nutrition/days/{date}` — брати норму періоду, що покриває `date`,
  а не чинну.
- `GET /progress/metrics/{metric}` — `ProgressPointView.target` і
  `outcome` кожної точки рахувати від норми її дати. Зараз усі точки
  міряються однією нормою.
- `ProgressSummaryView.lowerBound` / `upperBound` для калорій — від норми
  періоду; для відрізка, що накриває кілька періодів, потрібне рішення,
  **потребує уточнення**: показувати межі останнього періоду чи ховати
  зведення.
- Нове поле в картці прогресу: межі періодів, щоб клієнт намалював
  вертикальну лінію на `startDate`. Пропозиція —
  `periods: { startDate: string; calories: number }[]` у
  `ProgressCardView` для щоденних метрик.

### Що малює клієнт

- Чарт ваги — наскрізний, без поділу (вага не залежить від норми).
- Чарт КБЖВ — по періодах, з вертикальною лінією на `startDate` кожного
  нового періоду.

Мобільний застосунок цього ще не малює: без поля `periods` немає де взяти
межі. Щойно воно зʼявиться — це зміна лише в `MetricBarChart`.

## 7. Вікно прогресу рахується в UTC, а день — у часовому поясі пристрою

Знайдено на стенді 13.09 о 00:11 за Києвом (23:11 UTC 12.09):

```
GET /progress/metrics/calories?days=3
→ points: 2026-09-10, 2026-09-11, 2026-09-12
```

Пристрій уже на 13-му, сервер ще на 12-му. Тобто щовечора після
опівночі (і взагалі будь-коли східніше Гринвіча, коли локальна дата
випередила UTC) графіки прогресу відстають на день від головної.

Харчування цієї проблеми не має саме тому, що бере дату від клієнта:
`GET /nutrition/days/{date}`, і в `calendarDateSchema` прямо написано
чому — «страву о 01:00 їли вчора ввечері, і лише пристрій знає, якого це
було дня».

Прогрес такої можливості не дає: у `GET /progress/metrics` і
`GET /progress/metrics/{metric}` є лише `days`. Через це запис, зроблений
на 13.09, не потрапляє у вікно, яке закінчується 12.09 — користувач
бачить 125 ккал на головній і нуль на графіку.

Потрібен параметр дати кінця вікна — наприклад `to=YYYY-MM-DD` поряд з
`days`, — щоб клієнт назвав свій сьогоднішній день так само, як він це
робить для харчування.

## 8. Перевірити, що фіксований код підтвердження живе лише на стенді

`POST /auth/verify-email` на dev приймає `000000` для будь-якої адреси.
Для стенду це зручно (пошта нікуди не йде), але варто переконатись, що
в продакшн-конфігурації такої гілки немає — інакше підтвердити чужу
щойно зареєстровану адресу зможе будь-хто.

## 9. Підписка нарешті щось замикає — контракт гейтингу

Власник передав макети 13.09 (`docs/specs/client/subscription/free-tier/spec.md`).
Без підписки замкнені: частина рецептів каталогу, четверта власна страва,
авто-імпорт плану в список покупок, копіювання дня, додавання замкненого
рецепта в план і статистика прогресу. Зараз **жоден ендпоінт підписку не
перевіряє** (`handoff/mobile-ui-review.md`, 4.12): `findActive` кличуть лише
`GET /subscription` і профіль, обидва — щоб показати підпис на рядку.

Правило спеки (FR-017): замкнене відмовляє **сервер**, застосунок лише
малює замок. Прихована кнопка — не захист.

### 9.1. Стан доступу — разом із профілем

- `GET /profile` уже віддає `subscription` (стенд наздогнав джерело — рядок
  4.13 ревʼю в цій частині застарів). Поруч потрібне `isSubscribed`, а в
  `GET /subscription` — обʼєкт `entitlement` з `ownRecipes: { used, limit }`
  і переліком можливостей; точна форма — §10.5. Застосунок не рахує страви
  сам і не тлумачить `expiresAt`.
- `findActive` уже чесний щодо закінчення терміну; `entitled` — це
  `subscription !== null`, порахований один раз на сервері.
- Лічильник власних страв не можна брати з `GET /recipes?tab=own` —
  `meta.total` там звужений фільтрами (див. `recipe.service.ts`, коментар
  про «Показати N результатів»).

### 9.2. Замкнений рецепт — ознака на картці

- `RecipeCardView` і `RecipeDetailView` — нове поле `isLocked: boolean`,
  пораховане на того, хто питає: для підписника завжди `false`.
  `RecipeCardView.from(entity)` кличуть три сервіси — каталог (список і
  деталі), день плану, день харчування — і в кожен має дійти право
  глядача; `RecipeEntity` дістає `isPremium`. `RecipeRepository.list` уже
  отримує `userId` (join улюбленого) — місце є, зайвого запиту не буде.
  Поле проходить і в план (`PlanItemView.recipe`,
  `meal-plan/dto/outbound/plan-day.view.ts`),
  і в журнал харчування — там та сама `RecipeCard`.
- **Хто ставить замок — Q-1 спеки, власник ще не відповів.** Пропозиція:
  колонка `recipes.is_premium boolean not null default false`, поле в
  адмінці й колонка імпорту CSV. Правило «перші N безкоштовні» гірше:
  межа платного їздить разом із сортуванням.
- Відмови, а не лише приховування:
  - `GET /recipes/{id}` для замкненого без підписки — 403
    `catalog.recipe-locked` **або** відповідь без `ingredients` і `steps`
    (тизер). Що саме — Q-2; застосунок готовий до обох.
  - `POST /meal-plan/days/{date}/items` із замкненим `recipeId` — 403
    `catalog.recipe-locked`.
  - `POST /nutrition/days/{date}/meals` — те саме, якщо на Q-8 відповідь
    «замкнено».
  - `PUT /recipes/{id}/favorite` на замкненому — лишити дозволеним: макет
    тримає серце живим (Q-7).

### 9.3. Ліміт власних страв

- Константа `FREE_OWN_RECIPES_LIMIT = 3` у `packages/constants/src/subscription.ts`
  — одна на застосунок і сервер, шторка друкує «3/3» з відповіді.
- `POST /recipes` без підписки при `count(own) >= limit` — 403
  `catalog.own-recipes-limit`. Без тіла `{ used, limit }`:
  `GlobalExceptionFilter` лишає в помилці лише `statusCode`/`message`/
  `code`/`errors`, а число для шторки застосунок і так бере з
  `entitlement.ownRecipes` (§10.6). `count(own)` = `where source =
  'custom' and created_by = :userId` — індекс `recipes_source_creator_idx`
  уже є; той самий предикат — для `ownRecipes.used`. Рахувати
  **всередині транзакції під**
  `pg_advisory_xact_lock(hashtext('own-recipes:' || userId))`
  — інакше два паралельні POST обидва побачать «2» і дадуть четверту.
  Прецедент такої самої форми — `meal-plan.repository.ts:152`
  (`hashtext('meal-plan:' || userId)`).
- Що рахувати — живі страви чи створені за весь час — Q-3. Зараз видалення
  жорстке, тож «живі» = `count(*) where created_by = userId and source = 'custom'`;
  «за весь час» потребує лічильника на профілі.
- Що з четвертою після закінчення підписки — Q-4; до відповіді нічого з
  наявними стравами не робити.

### 9.4. Список, копіювання, прогрес

- `PUT /shopping-list/plan-import` (увімкнення) без підписки — 403
  `subscription.required`. `GET /shopping-list` без підписки — без позицій
  із плану і з `importFromPlan: false` незалежно від збереженого
  значення: після закінчення підписки нічого «вимикати» не треба, а після
  поновлення перемикач сам повертається в те, що було.
- `POST /meal-plan/days/{date}/copy` без підписки — 403 `subscription.required`.
  `PlanDayView.importsIntoShoppingList` без підписки — завжди `false`.
- `GET /progress/metrics` і `GET /progress/metrics/{metric}` без підписки —
  403 `subscription.required`. Альтернатива — віддавати порожні `points` і
  `summary`; застосунок малює шар однаково, але 403 чесніший і дешевший.
  Запис вимірів (`POST /progress/metrics/*/measurements`) лишається
  відкритим — так у макетах, підтвердження власника — Q-6.

### 9.5. Три коди відмови

- `subscription.required` (403) — дія замкнена цілком; застосунок показує
  шторку тієї дії, з якої прийшов.
- `catalog.recipe-locked` (403) — застосунок показує шторку «Додати до
  раціону» або веде на пейвол (картка).
- `catalog.own-recipes-limit` (403, без тіла — див. §9.3) — шторка
  «Створити страву» з числами зі знімка `GET /subscription`.

Зараз ні в `CatalogErrorCode`, ні в `SubscriptionErrorCode` нічого з цього
немає; шаблон `{ message, code }` + `ForbiddenException` уже є в `auth.service.ts`.

### 9.6. Пейвол із замка і `paywall/seen`

`PUT /subscription/paywall/seen` лишається одностороннім перемикачем для
пейволу **після анкети**. Пейвол, відкритий із замкненої дії, його не
викликає (spec paywall, FR-017) — серверу нічого не міняти, лише не
дивуватись, що `paywallPending` може лишатись `true` у людини, яка бачила
пейвол десять разів.

### 9.7. Чого ще немає в макетах, але вимагає магазин

На пейволі немає «Відновити покупки» і посилань на умови й політику
приватності — App Store без них екран підписки не пропускає (spec paywall,
FR-018). Це до дизайнера, не до бекенду; тут — щоб не загубилось.

## 10. Підписка: RevenueCat замість перевірки чеків; доступ вирішує сервер

> Рішення власника 13.09: оплата — через RevenueCat. Обґрунтування і
> відхилені альтернативи — ADR-0009 (`Proposed`). Налаштування дашбордів —
> рунбук `docs/runbooks/configure-revenuecat.md`. Тут — контракт для
> бекенду. Факти про RevenueCat перевірені по документації 13.09.2026;
> дизайн пройшов адверсарну перевірку трьома незалежними ревʼю — правки з
> неї вже тут.

### 10.1. Що є правдою

- **RevenueCat — правда про покупки в магазинах.** Чеків не парсимо і
  `CustomerInfo`, який приносить клієнт, не приймаємо. Після кожного
  вебхука і на `POST /subscription/sync` перечитуємо
  `GET https://api.revenuecat.com/v1/subscribers/{app_user_id}` секретним
  ключем і зводимо з базою. Так радить сам RC: подія описує одну
  транзакцію, а не стан клієнта; порядок подій не гарантований; доставка
  «принаймні один раз».
- **Живий рядок `subscriptions` — правда про доступ.** Той самий «один
  активний рядок на акаунт» (`subscriptions_one_active_per_user`), той самий
  `lockAccount(tx, userId)` (`pg_advisory_xact_lock(hashtext(
  'subscription-account'), hashtext(userId))`), той самий `findActive`
  (`status = active AND expires_at > now()`). Кожен гейт із §9
  і `GET /subscription` читають лише його — один індексований запит, без
  кешу. RC на шляху запиту не викликається ніколи. **Доступ ніколи не живе
  на рядку зі статусом, відмінним від `active`.**
- **`app_user_id` у RC = `users.id`.** Застосунок конфігурує SDK цим id
  після входу і `logOut()` не кличе. Аліасів бути не має; якщо у вебхуку
  прийде `$RCAnonymousID:…` — шукати наш id серед `original_app_user_id` і
  `aliases[]`.
- **Реферальний місяць, місяць-винагорода і ручний грант із дашборду RC —
  локальні рядки** (`source = referral`, `store = none`). Промо-гранти RC не
  складаються з платною підпискою (пізніша дата виграє, другий грант на
  активний відхиляється), тож рішення 2026-09-11 про перенесення
  подарованих днів поверх купленого через них не виконати. Новий енум
  `grant` не потрібен: грант — «подаровано, не продано», як referral.
- **Рядок «керований RC»** — `rc_product_id IS NOT NULL`, не `store ≠ none`.

### 10.2. Вебхук — `POST /webhooks/revenuecat`

Окремий `WebhooksModule`; `JwtGuard` не глобальний — контролер без
`@UseGuards(JwtGuard)` і так поза ним (`@Public()` живе лише в модулі auth і
тут не потрібен); `@SkipThrottle()` з `@nestjs/throttler`.
Повна адреса `https://<api>/api/v1/webhooks/revenuecat`.

**Авторизація.** `Authorization` збігається з одним зі значень
`REVENUECAT_WEBHOOK_AUTH` (список через кому — для ротації: додали нове →
деплой → змінили в дашборді → прибрали старе; кожне порівняння
constant-time). Якщо задано `REVENUECAT_WEBHOOK_SIGNING_SECRET` (теж
список) — заголовок `X-RevenueCat-Webhook-Signature: t=<unix>,v1=<hex>`
**обовʼязковий**: `v1 == HMAC-SHA256(secret, "<t>.<сирий body>")`,
`|now − t| ≤ 300 с`; відсутній або невірний — `401`. `t` — час
відправки, не `event_timestamp_ms`: ретрай через 80 хв перепідписується.
Для HMAC потрібне сире тіло: у `main.ts` `NestFactory.create(AppModule,
{ bufferLogs: true, rawBody: true })` і `@Req() req: RawBodyRequest<Request>`
→ `req.rawBody`. Невірний заголовок — `401` без запису.

**Вебхук лише записує.** Тіло `{ api_version: "1.0", event: {...} }`.
`INSERT INTO revenuecat_events (id = event.id, …) ON CONFLICT DO NOTHING`
і `200`. Дубль (RC повторює з тим самим `id`) — `200`, нічого. Не вдалося
вставити (база лежить) — `5xx`, хай RC ретраїть (5/10/20/40/80 хв, далі
губить). Жодних черг із client-api: **таблиця `revenuecat_events` і є
чергою** (outbox), обробляє воркер (§10.3). Так немає гілки «вставили,
enqueue впав, ретрай зловив `ON CONFLICT` і подія втрачена».

**Стан із payload не застосовувати ніколи** — ні `expiration_at_ms`, ні
`cancel_reason`; тип події не вибирає результат, його вибирає перечитаний
стан. Невідомий `type` — теж запис і `200`: нові типи RC додає без зміни
версії. `type = TEST` (кнопка в дашборді) — запис із `processed_at = now`,
без обробки: у ньому вигаданий `app_user_id`.

### 10.3. Воркер: обробка подій (ADR-0008, черга `maintenance`)

`JobName.RevenueCatEvents` — повторювана задача кожні 20 с. Реєстрація —
як у трьох наявних: `JobName` у `jobs.constants.ts`, поля в `JobsConfig`
(`common/config/config.type.ts` + `jobs.config.ts`), виклик у
`JobsScheduler.onApplicationBootstrap`, кейс у `JobsProcessor.run()`.
Період — `repeat: { every: 20_000 }`, а не 6-польний cron (у репо
секундних cron-ів ще немає). `schedule()` вішає на кожну задачу
`attempts: 3, backoff exponential 60_000` — для 20-секундної задачі ретрай
провалу накладеться на наступний запуск: задачі подій дати власні опції
(`attempts: 1`; повтори живуть у рядках через `next_attempt_at`). Бере
`processed_at IS NULL AND next_attempt_at <= now() ORDER BY received_at
LIMIT 50` і для кожної події:

1. **Спершу знайти користувача**: `app_user_id`, потім
   `original_app_user_id`, потім `aliases[]` — серед `users.id`. `TRANSFER`
   — усі id з `transferred_from[]` і `transferred_to[]`. Немає жодного →
   `processed_at = now`, `error = 'user-missing'`, без журналу і без
   виклику RC (`GET /v1/subscribers` **створює** клієнта, якого немає);
   `warn` з дедупом на `app_user_id` за добу. Користувача видалено — саме
   цей випадок: `revenuecat_customers.user_id … ON DELETE CASCADE`, як
   скрізь; а видалення акаунту має ще й видаляти клієнта в RC — пункт до
   ADR-0005.
2. **Журнал грошей** `store_transactions` — лише для `INITIAL_PURCHASE`,
   `RENEWAL` і `NON_RENEWING_PURCHASE` зі справжнім магазином
   (`APP_STORE`/`MAC_APP_STORE` → `apple`, `PLAY_STORE` → `google`;
   `PROMOTIONAL`/`TEST_STORE` — пропустити): `(store, transaction_id) ON
   CONFLICT DO NOTHING`, `product_id`, `plan_id` за product id, `is_trial
   = period_type = 'TRIAL'`, `price_cents = price_in_purchased_currency ==
   null ? null : round(× 100)` (може бути 0 чи відʼємна — пишемо як є),
   `currency`, `started_at = purchased_at_ms`, `expires_at =
   expiration_at_ms` (null → пропустити рядок). `is_family_share = true` →
   `price_cents = 0`. `PRODUCT_CHANGE` грошей не рухає — не журналюємо.
3. **Ресинк** (§10.4) для кожного знайденого id. Для `TRANSFER` —
   `transferred_from` ресинкати з ознакою `revoked-by-transfer`, а для
   `transferred_to` — `no-reward`.
4. Успіх → `processed_at = now`. Помилка → `attempts + 1`,
   `next_attempt_at = now + min(2^attempts × 30 с, 1 год)`, `error`; без
   стелі спроб — доки RC не відповість. `401`/`403` від RC —
   `RevenueCatAuthError`: подію не позначати, лічильник
   `dns_revenuecat_auth_failures_total` у `JobsMetrics`, щоб відкликаний
   ключ помітили за хвилини, а не з тікета.
5. Метрика `dns_revenuecat_events_unprocessed` (gauge) у `JobsMetrics`
   (`apps/worker/src/jobs/jobs.metrics.ts`, `registers: [this.registry]`,
   як `dns_worker_job_runs_total`) — правило в
   `infra/prod/grafana/provisioning/alerting/rules.yml` на > 0 довше 15 хв.

Один правило на всі типи: **кожна подія з розпізнаним користувачем —
ресинк** (він ідемпотентний і коштує один GET). Без ресинку — лише `TEST`
і події без `app_user_id`/`transferred_*`.

### 10.4. Ресинк — одна функція на подію, `sync` і звірку

Де що живе. `RevenueCatClient.getSubscriber(appUserId)` (HTTP + stub) —
`packages/api-infrastructure/src/revenuecat/` (`RevenueCatModule
.forRootAsync`), як решта адаптерів; `api-infrastructure` не залежить від
`@dns/database`, тож у `stub` клієнт бере дані через переданий
`SubscriberSource` (колбек), а не читає базу сам. `RevenueCatSyncService
.sync(userId, hint?)` — у `@dns/api-common` поруч із `NotificationsProducer`
(там уже є `@dns/database` і `@dns/constants`); туди ж — `ReferralRewardService`,
винесений з приватного `SubscriptionService.rewardReferrer`. `apps/worker`
додає залежність `@dns/api-infrastructure`. Саме зведення (п. 5) — новий
публічний метод репозиторію `applyStorePeriod(userId, period, hint)` у
транзакції, за зразком `redeemReceipt`: `lockAccount`, `sweepLapsed`,
`convertedRedemption` — приватні функції модуля, ззовні їх не викликати.

1. `GET /v1/subscribers/{id}`, `Authorization: Bearer <sk_>`, **без**
   `X-Platform` (RC блокує секретний ключ із ним як «витік у бандл»). Усі
   виклики до RC — через один процесний лімітер (~1 запит/с, burst 5;
   недокументована порада RC для v1), спільний для подій, `sync` і звірки.
   `429` одразу після події — «інший запит у польоті»: пауза 2 с, backoff.
2. **Монотонність.** Відповідь має `request_date_ms`. У транзакції під
   блокуванням акаунта, до будь-якого запису: якщо `request_date_ms ≤
   revenuecat_customers.request_date_ms` — no-op. Три виклики на одного
   користувача (подія, `sync` із застосунку, звірка) інакше застосували б
   старіший знімок поверх новішого.
3. Upsert `revenuecat_customers` (§10.5) — **усередині** тієї самої
   транзакції, після блокування.
4. Обчислити **період магазину** `P`. Порівняння значень `store` і
   `period_type` — без урахування регістру (для v1 їхнє написання не
   підтверджене; для вебхуків — верхній регістр). Перебрати **всі** записи
   `subscriber.subscriptions`, чиї product id належать нашим планам, плюс
   `rc_promo*`:
   - `billedUntil` кожного = `max(expires_date, grace_period_expires_date)`;
     `P` — запис із найпізнішим `billedUntil`; при рівності магазинний
     виграє у `PROMOTIONAL`;
   - `ent = entitlements[REVENUECAT_ENTITLEMENT_ID]`. `ent` є, а
     відповідного запису в `subscriptions` немає (grant під час збою RC,
     нова форма відповіді) → `warn`, `P = undefined` — **нічого не
     чіпати**, `error = 'no-subscription-for-entitlement'`;
   - `store`: `apple` | `google` | `PROMOTIONAL → none, source =
     referral`; інше — `error`, `P = undefined`, нічого не чіпати;
   - `isTrial = period_type = TRIAL`; `INTRO` — оплачений період;
   - `startedAt = purchase_date` (початок періоду — попередньо, див. п. 8),
     `originalPurchaseAt = original_purchase_date`, `ownershipType`,
     `environment = is_sandbox ? sandbox : production`;
   - `billedUntil ≤ now` або `refunded_at` є → `P = null` («магазин каже
     ні»).
   - `sandbox` при `REVENUECAT_ENTITLE_SANDBOX = false` → у дзеркалі
     лишити, для доступу `P = null`.
   **`P = null` лише на позитивних доказах** — прострочена дата, refund
   або ознака `revoked-by-transfer` від `TRANSFER`. Все, чого не змогли
   прочитати, — `undefined` і no-op: неправильний `REVENUECAT_ENTITLEMENT_ID`
   чи чужий ключ не мають за один прохід звірки погасити всіх платників.
5. Звести `P` з живим рядком `L` (після `sweepLapsed`). Це сьогоднішній
   `redeemReceipt` з іншим входом плюс дві нові гілки:
   - `unbilled(L) = max(0, L.expires_at − max(now, L.billed_until))` —
     подароване поверх оплаченого (для локального `L` — весь залишок).
   - `P = null`, `L` керований RC → **закрити з перенесенням**: `L.status
     = cancelled`, `L.expires_at = now`; якщо `unbilled > 0` — у тій самій
     транзакції вставити локальний рядок точно тієї форми, що пише
     `grantReferralReward` (`source = referral`, `store = none`, план за
     `REFERRAL_REWARD.planSlug` (= monthly, `isActive`), `started_at = now`,
     `expires_at = now + unbilled`, `price_paid_cents = 0`,
     `full_price_cents = plan.priceCents`, `currency = plan.currency` —
     колонка NOT NULL, `referral_code` з `L`). Так подароване
     лишається на **`active`** рядку, який бачать `findActive`, індекс і
     нічний sweep; `cancelled` з майбутньою датою — невидимий для всіх, і
     це була б втрата місяця рефереру на кожному refund/`TRANSFER`.
   - `P = null`, `L` локальний або немає → нічого.
   - `P`, `L` немає → вставити: `source = isTrial ? trial : (store = none
     ? referral : purchase)`, `store`, `plan_id` за product id (серед усіх
     планів; невідомий → `error`, не писати), `started_at`,
     `store_original_purchase_at`, `billed_until = expires_at =
     billedUntil`, `environment`, `rc_product_id`, `rc_ownership_type`,
     `price_paid_cents` за планом (0 для trial/referral і для
     `FAMILY_SHARED`).
   - `P`, `L` керований RC, той самий `rc_product_id`, `P.billedUntil =
     L.billed_until` → **no-op** (лише `rc_synced_at`, п. 8).
   - `P.billedUntil > L.billed_until`, той самий `rc_product_id`, і за цей
     період **немає** нового платного рядка в журналі (grace, продовження
     від підтримки) → **оновити на місці**: `billed_until`, `expires_at =
     P.billedUntil + unbilled(L)`. Без нового рядка — бо це не чек
     (FR-013) і не привід для сповіщення.
   - `P.billedUntil > L.billed_until` в інших випадках (поновлення, апгрейд,
     покупка поверх локального місяця) → **замінити з перенесенням**, як
     чек сьогодні: новий рядок `expires_at = P.billedUntil + unbilled(L)`,
     старий — `expired`, `expires_at = now`; `source = purchase`, якщо
     `!isTrial`.
   - `P.billedUntil < L.billed_until` і `P.rc_product_id = L.rc_product_id`
     (повернення коштів за частину) → **скоротити**: `billed_until =
     P.billedUntil`, `expires_at = P.billedUntil + unbilled(L)`; результат
     ≤ now → як «закрити з перенесенням». Інший `rc_product_id` (короткий
     грант поруч із живою річною) → нічого.
   `store_transaction_id` у `subscriptions` для RC-рядків — `null` (у RC
   один id на підписку, другий рядок упав би на унікальному індексі).
6. Після коміту:
   - `dismissPaywall` і `subscription_activated` — **лише на переході
     «без доступу → з доступом»** (живого рядка не було або він минув).
     Поновлення — нічого: інакше кожен підписник отримує «Підписку
     активовано» щомісяця о годині списання Apple.
   - рядок закрито ресинком (refund, `TRANSFER`) → `subscription_expired`
     одразу з дедупом `NotificationDedupeKey.subscriptionExpired(row.id)`
     — нічний sweep `cancelled` не бачить.
   - `rewardReferrer(userId)` — **лише коли в журналі зʼявився платний
     рядок** цього користувача за цей період (`price_cents > 0`) і ресинк не
     з ознакою `no-reward`. Конверсія — `source = purchase AND
     store_original_purchase_at ≥ redeemed_at`: підписка, перенесена
     `TRANSFER`-ом з іншого акаунта, або куплена до коду — не конверсія
     (`original_purchase_date` старіший за код); trial → paid — конверсія
     (trial почався після коду) в момент `RENEWAL` з `price_cents > 0`;
     grace після невдалої конверсії trial — ні (платного рядка немає);
     `FAMILY_SHARED` — ні (`price_cents = 0`). Це заміна `convertedRedemption()`
     (`started_at >= redeemed_at`), яку читає і `referralStats` — число
     «конвертовано» на екрані рефералів міняє означення; для рядків до RC
     `coalesce(store_original_purchase_at, started_at)`. Це закриває фарм
     реферальних місяців через `TRANSFER` між власними акаунтами, який
     відкривається, щойно зникає унікальний чек.
7. Сповіщення при `TRANSFER` тому, хто втратив: `subscription_transferred`
   («підписку перенесено на інший акаунт RationFit») — нове значення
   `NotificationEvent` (`packages/shared-types/src/notifications.ts`;
   `NotificationType`
   — це вид картки, лишається `subscription`), `ADD VALUE` в енум
   `notification_event` окремою міграцією в кінці, шаблон у
   `packages/constants/src/notification-templates.ts`; інакше його пейвол
   виглядає як баг. Там само вже оголошено `SubscriptionCancelled` «needs
   store notifications» — тепер є з чого: шле ресинк, коли
   `unsubscribe_detected_at` стає непорожнім (дедуп по рядку). Текст —
   питання власнику (§10.15).
7а. Коли в журналі зʼявився платний рядок за поточний період — оновити
   `subscriptions.price_paid_cents` і `currency` з
   `price_in_purchased_currency`/`currency` події: чек (FR-013) має казати
   сплачене в валюті магазину, а не ціну плану в USD. Для TRIAL лишається
   0 — застосунок показує «Безкоштовно».
8. `rc_synced_at`, `request_date_ms`, `last_event_id` — у дзеркало. На
   гілці no-op ще й `started_at = ledger.started_at`, якщо журнал знає
   пізніший початок періоду: `purchase_date` з v1 може виявитись
   початком не поточного періоду — журнал з події точніший.

### 10.5. Схема

`subscriptions`:

- `+ billed_until timestamptz null` — до якої дати сплатив магазин. Сьогодні
  це join на `store_transactions.expires_at`; у RC-рядків власного чека
  немає, тож колонка. **Бекфіл**: `coalesce((select max(t.expires_at) from
  store_transactions t where t.subscription_id = s.id), s.expires_at)` для
  `store ≠ none`, `null` для локальних — те саме читання, що робить
  `redeemReceipt`; `= expires_at` напряму зробило б уже нарахований місяць
  винагороди «оплаченим», і перша ж заміна його зʼїла б. Бекфіл — один
  раз у міграції; далі колонка авторитетна (`store_transactions
  .subscription_id` у RC-рядків порожній).
- `+ environment text null` (`production` | `sandbox`), `null` для
  локальних.
- `+ rc_product_id text null`, `+ rc_ownership_type text null`,
  `+ store_original_purchase_at timestamptz null`, `+ rc_synced_at
  timestamptz null`.
- `status = cancelled` нарешті вживається: refund, перенесення на інший
  акаунт. Енуми `subscription_source` і `purchase_store` — без змін.

`revenuecat_events`: `id text PK` (id події RC), `type`, `app_user_id`,
`environment`, `store`, `event_timestamp_ms bigint`, `received_at`,
`processed_at null`, `attempts int default 0`, `next_attempt_at`, `error
null`, `raw jsonb`. Індекси `(app_user_id, received_at)`, частковий
`(next_attempt_at) WHERE processed_at IS NULL`.

`revenuecat_customers` (дзеркало, 1 рядок на акаунт, `user_id PK → users
ON DELETE CASCADE`): `entitlement_active bool`, `expires_at`,
`grace_period_expires_at`, `unsubscribe_detected_at`,
`billing_issues_detected_at`, `refunded_at`, `is_sandbox`,
`request_date_ms bigint`, `last_event_id`, `rc_synced_at`, `raw jsonb`
(відповідь `GET /subscribers` — для підтримки). Доступ по ньому не
рахується.

`store_transactions` лишається журналом грошей; `subscription_id` для
RC-рядків можна не заповнювати.

### 10.6. `GET /subscription` — знімок права доступу

Форма розширюється, старі поля без змін. Це і є `entitled` з §9.1:

```json
{
  "subscription": { "…SubscriptionView як зараз…" },
  "paywallPending": false,
  "entitlement": {
    "isSubscribed": true,
    "activeUntil": "2027-09-13T10:00:00.000Z",
    "source": "purchase",
    "periodType": "normal",
    "store": "apple",
    "willRenew": true,
    "environment": "production",
    "ownRecipes": { "used": 2, "limit": null },
    "features": {
      "lockedRecipes": true, "ownRecipesUnlimited": true,
      "shoppingListImport": true, "copyPlan": true,
      "addLockedToPlan": true, "progressAnalytics": true
    }
  },
  "synced": true,
  "syncedAt": "2026-09-13T09:59:40.000Z",
  "pendingSince": null
}
```

- `isSubscribed = subscription !== null` (живий рядок за датою — як зараз);
  `activeUntil = subscription.expiresAt`.
- `source`: `purchase | trial | referral | null`. `periodType`: `trial |
  normal | grace | referral | null` — `grace`, коли дзеркало має
  `billing_issues_detected_at IS NOT NULL AND grace_period_expires_at >
  now()` (не залежить від того, чи RC зсуває `expires_date` на кінець
  grace — це не підтверджено).
- `willRenew` — з дзеркала (`unsubscribe_detected_at is null` і рядок
  керований RC); для локальних `false`.
- `ownRecipes.used` — кількість власних страв (що рахуємо — free-tier Q-3);
  `limit` — `FREE_OWN_RECIPES_LIMIT` без підписки, `null` з нею. Рахунок
  дешевий (`count where created_by`), але знімок читається на кожен
  foreground — якщо стане помітно, віддати з домену рецептів.
- `features` — шість булевих `true = доступно`; сьогодні всі шість
  дорівнюють `isSubscribed`. Окремий перелік — щоб застосунок не тримав
  власну таблицю «що замкнено». Ключі збігаються з `feature` у відмовах
  §9.5.
- `synced`/`pendingSince` — §10.7. `syncedAt` — `rc_synced_at` або `null`.
- `GET /profile` додає `isSubscribed: boolean` — одне поле, щоб перший екран
  після входу знав стан без другого запиту (free-tier FR-001).

### 10.7. `POST /subscription/sync` — `200` зі знімком §10.6

Дія дієсловом (ADR-0004, правило 7): «звіритися з RC зараз». Тіло
`{ reason: 'purchase' | 'restore' | 'listener' | 'foreground' }`.

- `purchase`/`restore` — завжди йти в RC. `listener`/`foreground` — якщо
  `rc_synced_at` молодший за 5 с, знімок без виклику. Без цього слухач
  `CustomerInfo`, що спрацював за секунду до `purchasePackage`, зʼїв би
  саме той `sync`, який закриває пробіл до вебхука.
- **Бюджет ≤ 5 с** на цьому синхронному шляху (одна спроба + один повтор
  на `429`). Не вклалися, RC лежить, `5xx`, таймаут → **`200`** з поточним
  знімком, `synced: false`, `pendingSince: <ISO>`; дзеркало не чіпаємо.
  Людині, яка щойно заплатила, `5xx` не відповідаємо ніколи; застосунок
  показує «активуємо» і повторює на foreground; вебхук доробить.
- Ліміт: `ThrottleKey.SubscriptionSync = 'subscription-sync'` в енумі
  (`common/config/config.type.ts`) + рядок `rule(…)` у
  `throttler.config.ts`; `THROTTLE_SUBSCRIPTION_SYNC_TTL = 60000`,
  `THROTTLE_SUBSCRIPTION_SYNC_LIMIT = 6` у `.env.example` — `qa-up.sh`
  підіймає всі `THROTTLE_*_LIMIT` до 10000 на стенді.
- У режимі `stub` (§10.12) приймає ще `dev`; у `live` поле `dev` — `400`.

### 10.8. `POST /subscription/receipt` і `POST /subscription/redemptions`

- **`/receipt` — прибрати** разом із `submitReceiptSchema`,
  `SubmitReceiptInboundDto` і `PurchasesService`
  (`@dns/api-infrastructure/purchases`): транзакції фінішить і валідує RC.
  Мобілка його не кликала в жодній збірці.
- **`/redemptions` — без змін**: погашення + локальний місяць,
  `already-subscribed`, якщо живий рядок є (магазинний теж). Перед перевіркою
  живого рядка ресинк **не** робити — інакше погашення залежатиме від
  доступності RC; звірку зробить наступна подія.
- `GET /subscription/plans` — без змін; `appleProductId`/`googleProductId`
  у сіді мають збігатися з магазином (product id вирішує власник).

### 10.9. Гейти

Маршрути, коди відмов, ліміт і правило списку покупок — **§9.2–9.5 без
змін**. Усі вони кличуть один предикат `EntitlementService
.assertEntitled(userId, feature)` = `findActive(userId) !== null`.
`SubscriptionModule` сьогодні нічого не експортує, а Catalog/MealPlan/
ShoppingList/Progress його не імпортують — тож маленький
`EntitlementModule` лише з `SubscriptionRepositoryModule`, який імпортують
ці чотири модулі — один
запит по `subscriptions_user_idx`, без Redis-кешу (кеш булевого значення
на 30 с тримав би доступ після дати; кеш дати — YAGNI, доки не виміряли).
Гейт — у сервісі домену, не в контролері. Замки повертаються **за датою**
(`findActive`); нічний `markExpired` лише позначає рядки і шле
`subscription_expired` до 24 год пізніше — прийнято; для рядків, закритих
ресинком, сповіщення шле сам ресинк (§10.4, п. 6).

### 10.10. Env

| Змінна | Що |
| --- | --- |
| `REVENUECAT_MODE` | `stub` \| `live`. За замовчуванням `stub`; `scripts/qa-up.sh` примусово `stub`; `live` без ключа — падіння на старті; `production` без `live` — падіння на старті. Не «вивід з наявності ключа»: одна забута змінна в проді не має перетворювати `sync` на роздачу Premium |
| `REVENUECAT_SECRET_KEY` | v1 секретний ключ `sk_…` (саме v1 — v2-ключ для `GET /v1/subscribers` не працює). Ніколи в застосунок. Ротація: створити новий (два живуть паралельно) → деплой → відкликати старий |
| `REVENUECAT_WEBHOOK_AUTH` | значення `Authorization` з дашборду, ≥32 випадкових символи; список через кому на час ротації |
| `REVENUECAT_WEBHOOK_SIGNING_SECRET` | HMAC-секрет інтеграції (показується один раз); список через кому; порожній → підпис не вимагається |
| `REVENUECAT_ENTITLEMENT_ID` | `pro` |
| `REVENUECAT_ENTITLE_SANDBOX` | `true` — sandbox-період дає доступ (стенд, TestFlight до релізу); `false` після релізу |
| `REVENUECAT_API_URL` | `https://api.revenuecat.com/v1` |
| `THROTTLE_SUBSCRIPTION_SYNC_TTL` / `_LIMIT` | `60000` / `6` |
| `JOBS_REVENUECAT_EVENTS_CRON` | `*/20 * * * * *` (кожні 20 с) |
| `JOBS_REVENUECAT_RECONCILE_CRON` | `*/30 * * * *` |
| `JOBS_REVENUECAT_NIGHTLY_CRON` | `41 4 * * *` |

Воркер потребує тих самих `REVENUECAT_*` (він і ходить у RC). Прибрати
`APPLE_BUNDLE_ID`, `APPLE_ISSUER_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`,
`GOOGLE_PACKAGE_NAME`, `GOOGLE_SERVICE_ACCOUNT_JSON` разом із
`purchasesConfig`/`PurchasesConfig`/`PURCHASES_CONFIG` (`common/config`),
імпортом `PurchasesModule` в `app.module.ts`, коментарем у
`infra/prod/env.prod.example` і типами `VerifiedReceipt`/`ReceiptOutcome`
в репозиторії (креди тепер у дашборді RC); `APPLE_CLIENT_ID`/
`GOOGLE_CLIENT_ID` — OAuth, лишаються. «Production» для fail-fast в обох
процесах — `NODE_ENV=production` (client-api має ще `AppEnv`, воркер —
лише `NODE_ENV`). Мобілка:
`EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_…` (публічний, у бандл; пізніше
`EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_…`).

### 10.11. Звірка (воркер)

- `JobName.RevenueCatReconcile` — кожні 30 хв, `sync` для акаунтів, де:
  живий RC-рядок має `billed_until ∈ [now − 24 год, now + 2 год]`; або
  дзеркало має `expires_at`/`grace_period_expires_at` у тому ж вікні; або
  за 48 год була подія з `error` чи без `processed_at`; або дзеркало каже
  `entitlement_active = true`, а живого RC-рядка немає (RC каже
  «оплачено», ми — «ні»: покупка під час збою RC). Останнє — єдиний шлях
  для новачка, який купив, поки RC лежав понад 2,6 год.
- **Запобіжник**: якщо в одному проході звірка збирається закрити понад
  5 % рядків або понад 20 — зупинитись, не закривати нічого, алерт. Чужий
  ключ або перейменований entitlement не мають погасити всіх платників за
  півгодини.
- На старті (обидва процеси в `live`): один `GET /v1/subscribers` на
  відомий тестовий id — у відповіді має бути ключ
  `REVENUECAT_ENTITLEMENT_ID` в `entitlements`; інакше `error` у лог.
- `JobName.RevenueCatNightly`: RC-рядки, що згасли за останні 3 дні, а
  дзеркало каже `unsubscribe_detected_at is null` — `sync`: поновлення
  могло пройти без події. Наявний `subscription-expiry` — без змін.

### 10.12. Sandbox, TestFlight, стенд

- У RC немає «sandbox-користувачів»: `environment` — властивість
  транзакції. TestFlight = production Apple ID + sandbox-покупки ⇒ події
  `SANDBOX`, поновлення раз на 24 год до 6 разів. Dev-збірка на фізичному
  iPhone із Sandbox Apple Account: рік → 1 год, місяць → 5 хв, до 12
  поновлень — єдиний швидкий шлях перевірити expiry/grace end-to-end. У RC
  ліміт 100 чеків App Store на клієнта — довгі сесії ротують акаунти.
- Одна інтеграція вебхука на прод (production + sandbox, усі події);
  `environment` пишеться в рядок; доступ sandbox-рядку дає лише
  `REVENUECAT_ENTITLE_SANDBOX`. Після релізу — `false` **і один прохід**:
  `subscriptions where environment = 'sandbox' and status = 'active'` →
  «закрити з перенесенням» (§10.4); звірка сама їх не зачепить, бо дата
  далеко. Попередити тестерів.
- **Шов один**: `RevenueCatClient.getSubscriber(appUserId)`. У `stub` він
  повертає те, що віддає переданий `SubscriberSource` — читання
  `revenuecat_customers.raw` для цього користувача з api-common (порожній
  subscriber, якщо нічого). `POST /subscription/sync
  { dev: { productId, periodType: "TRIAL"|"NORMAL", expiresAt, store:
  "apple", isSandbox, refundedAt? } }` у `stub` записує вигаданого
  subscriber у `raw` і далі йде **звичайним** `sync` — тож `curl`-нута
  `INITIAL_PURCHASE` для того самого користувача, звірка і db-тести
  проходять через той самий код з тим самим фікстуром. У QA-стенді
  (`scripts/qa-up.sh` бере `.env` розробника) `stub` примусовий — інакше
  справжній `sk_` у `.env` мовчки ходив би в продовий проєкт RC і
  створював фантомних клієнтів.
- Однорядкову інструкцію «зробити акаунт підписаним / протермінованим /
  з refund через `dev`» — у `$QA_ROOT/run/env.md`, який пише `qa-up.sh`
  для QA-агента.

### 10.13. Події → стан

Кожна подія з розпізнаним користувачем → ресинк; тип вирішує лише журнал і
кого ресинкати. Результат нижче — те, що знайде перечитаний стан.

| Подія | Ресинк знайде | Рядок `subscriptions` | Застосунок бачить |
| --- | --- | --- | --- |
| `INITIAL_PURCHASE` TRIAL | ent активний, `period_type=TRIAL` | новий `source=trial`, `store=apple`; `subscription_activated` | `isSubscribed`, `periodType=trial` |
| `INITIAL_PURCHASE` NORMAL/INTRO | ent активний | `source=purchase`; платний рядок у журналі → `rewardReferrer` | `periodType=normal`, `willRenew` |
| `RENEWAL` (і `is_trial_conversion`) | `expires` пізніше | заміна з перенесенням; trial → purchase; платний рядок → `rewardReferrer`; без сповіщення | `activeUntil` далі |
| `CANCELLATION` UNSUBSCRIBE / DEVELOPER_INITIATED / PRICE_INCREASE / UNKNOWN | `unsubscribe_detected_at` | без змін — доступ до дати; `subscription_cancelled` раз на рядок | `willRenew=false` |
| `CANCELLATION` CUSTOMER_SUPPORT (refund) | `refunded_at`, ent неактивний | закрити з перенесенням: `cancelled` + локальний рядок на подароване; `subscription_expired`; винагорода рефереру не відкликається (referral spec) | `isSubscribed=false` або лише подароване |
| `REFUND_REVERSED` | ent знову активний | «`P`, `L` немає → вставити» | доступ повернувся |
| `BILLING_ISSUE` + `CANCELLATION` BILLING_ERROR | `grace_period_expires_date` | оновити на місці до кінця grace | `periodType=grace`, доступ є |
| `UNCANCELLATION` | `unsubscribe_detected_at=null` | без змін | `willRenew=true` |
| `EXPIRATION` будь-яка причина | ent неактивний, дата минула | `expired` за датою (`findActive` уже каже «ні»); подароване поверх — локальним рядком | замки повернулись, дані на місці |
| `PRODUCT_CHANGE` | нічого зараз або разом із `RENEWAL` | план змінюється при заміні; журнал не пишемо | новий `planName` після поновлення |
| `SUBSCRIPTION_EXTENDED` | `expires` пізніше, платного рядка немає | оновити на місці | `activeUntil` далі |
| `TRANSFER` | у `from` ent зник, у `to` зʼявився | `from`: закрити з перенесенням, `subscription_transferred`; `to`: новий рядок **без** винагороди | `from` без підписки, `to` з нею |
| `NON_RENEWING_PURCHASE` store=PROMOTIONAL (грант із дашборду; завжди `PRODUCTION`, без `app_id`) | `rc_promo*` активний | локальний `source=referral`, `store=none`, ціна 0 | `periodType=referral` |
| Ревокація гранту з дашборду | `rc_promo*` зник | `P` для цього `rc_product_id` = null → закрити | без підписки |
| `TEMPORARY_ENTITLEMENT_GRANT` (збій RC, ≤24 год) | найчастіше RC ще лежить → ресинк не вдається, ретрай | нічого до справжньої `INITIAL_PURCHASE`/`EXPIRATION` | нічого |
| `SUBSCRIPTION_PAUSED` (Google, пізніше) | ent активний | без змін; знімає лише `EXPIRATION(SUBSCRIPTION_PAUSED)` | доступ до кінця періоду |
| `TEST`, події без `app_user_id` | — | запис, `processed_at = now`, без ресинку | — |
| Дубль / не той порядок | — | `ON CONFLICT DO NOTHING`; порядок байдужий (стан перечитується, `request_date_ms` монотонний) | — |
| Подія не дійшла (RC здався) | — | звірка за ≤30 хв; `sync` із застосунку на foreground/покупці | стан вірний за ≤30 хв |

### 10.14. Тести (щоб не реверсити з коду)

`subscription.db-spec.ts` сьогодні ганяє `redeemReceipt` у 19 місцях і
раунди конкурентності «той самий чек ×5», «чек на двох акаунтах». Вони не
мапляться 1:1 — «чек на двох» стає `TRANSFER` з двома користувачами.
Задачі воркера тестуються в `apps/worker/test` (`jest.db.config.ts`),
правила зведення — у `subscription.db-spec.ts`. Матриця для `sync`
(фікстур — один білдер `SubscriberDto`, спільний зі stub-ом): вставити /
no-op / замінити з перенесенням / оновити на місці
(grace, extension) / скоротити / закрити з перенесенням (refund, `TRANSFER`)
/ невідомий product / sandbox при `ENTITLE_SANDBOX=false` / `TRANSFER`
обидві сторони / дубль події / події не в порядку (`request_date_ms`) /
refund зберігає подароване / trial → purchase нагороджує рефереру рівно
раз / колишній підписник із кодом не нагороджує (`original_purchase_date`
< коду) / grace після trial не нагороджує / `FAMILY_SHARED` не нагороджує
/ `dev` у `live` — `400`; конкурентність: `sync` ×5 один користувач, `sync`
проти події, покупка проти погашення, винагорода проти поновлення.

### 10.15. Що ще не вирішено (питання власнику)

- Product ID у магазинах — назавжди й на обидва магазини. Пропозиція
  `rationfit_pro_annual` / `rationfit_pro_monthly` (без ціни в id; малі
  літери — валідно і для Google). Сід `subscription_plans` під відповідь.
- Чи дають sandbox-покупки (TestFlight) доступ у проді до релізу.
  Пропозиція: так, до дня релізу.
- Billing Grace Period 16 днів в App Store Connect — вмикати? Пропозиція:
  так.
- **iOS 15.** Deployment target 15.1; на iOS 15 SDK іде StoreKit 1, а для
  нього RC вимагає App-Specific Shared Secret — інакше ті, хто платить на
  iOS 15, не отримають доступу. Або підняти target до 16.0 (Expo 55
  дозволяє), або додати secret у RC (рунбук, крок A2б). Пропозиція —
  підняти до 16.0: одна гілка менше.
- Текст `subscription_transferred` і чи взагалі повідомляти того, хто
  втратив підписку через `TRANSFER`.
- Що показує застосунок при `periodType=grace` — банер «проблема з
  оплатою» з `management_url` чи нічого. Дизайну немає.
- Free-tier Q-1…Q-4.
- Хто платить за план RevenueCat; доступ Олегу до проєкту.

## 11. Зведений перелік робіт (§9 + §10), у порядку залежностей

> Що саме зробити і в якому порядку; деталі — у розділах, на які вказано.
> Мобільна частина — `TODO_FE_RC.md`.

**A. Можна одразу, без RevenueCat.** Замки працюють і з тими рядками
`subscriptions`, які вже є (реферальні місяці) — застосунок гейтить по
`GET /subscription`, а не по магазину.

- [ ] `packages/constants/src/subscription.ts`: `FREE_OWN_RECIPES_LIMIT = 3`
      (§9.3).
- [ ] Коди відмов `subscription.required`, `catalog.recipe-locked`,
      `catalog.own-recipes-limit` (без тіла, §9.3) у `CatalogErrorCode` /
      `SubscriptionErrorCode` + `@dns/shared-types` (§9.5).
- [ ] Міграція: `recipes.is_premium boolean not null default false` (§9.2 —
      після відповіді власника на free-tier Q-1; поки немає — колонка є,
      усі `false`); `subscriptions` + `billed_until` (з бекфілом §10.5),
      `environment`, `rc_product_id`, `rc_ownership_type`,
      `store_original_purchase_at`, `rc_synced_at`.
- [ ] `EntitlementModule` + `EntitlementService.assertEntitled(userId,
      feature)` на `SubscriptionRepositoryModule`; імпортують Catalog,
      MealPlan, ShoppingList, Progress; один `findActive`, без кешу
      (§10.9).
- [ ] Гейти в сервісах доменів: `POST /recipes` — ліміт під
      `pg_advisory_xact_lock('own-recipes:' || userId)` (§9.3);
      `POST /meal-plan/days/{date}/items` із замкненим рецептом,
      `POST /meal-plan/days/{date}/copy`, `PUT /shopping-list/plan-import`
      і `GET /shopping-list` без позицій плану, `GET /progress/metrics*`
      (§9.4).
- [ ] `RecipeEntity.isPremium` → `RecipeCardView` / `RecipeDetailView
      .isLocked` на того, хто питає, у всіх трьох місцях, де кличуть
      `from()` (каталог, день плану, день харчування);
      `GET /recipes/{id}` для замкненого — 403 або тизер (free-tier Q-2)
      (§9.2).
- [ ] `GET /subscription` → обʼєкт `entitlement` (§10.6) — до RC поля
      `willRenew=false`, `environment=null`, `synced=true`;
      `GET /profile.isSubscribed`.
- [ ] Swagger і `docs/specs/client/subscription/paywall/plan.md` —
      синхронізувати після мержу (docs/CLAUDE.md, «Keeping docs in sync»).

**B. RevenueCat — інфраструктура (спільна для client-api і воркера).**

- [ ] `packages/api-infrastructure/src/revenuecat/`: `RevenueCatModule
      .forRootAsync`, `RevenueCatClient.getSubscriber` (`live` + `stub`
      через `SubscriberSource`), лімітер ~1 запит/с; `@dns/api-common`:
      `RevenueCatSyncService.sync(userId, hint)` за §10.4; репозиторій:
      публічний `applyStorePeriod(...)`; `apps/worker` додає
      `@dns/api-infrastructure`.
- [ ] Міграції: `revenuecat_events` (outbox), `revenuecat_customers`
      (дзеркало) (§10.5).
- [ ] Винести `rewardReferrer` з приватного методу `SubscriptionService` у
      спільний `ReferralRewardService` (api-common), доступний воркеру;
      конверсія — за `store_original_purchase_at` і платним рядком журналу;
      `referralStats` рахує за тим самим правилом (§10.4 п. 6).
- [ ] Config: `REVENUECAT_MODE`, `REVENUECAT_SECRET_KEY`,
      `REVENUECAT_WEBHOOK_AUTH`, `REVENUECAT_WEBHOOK_SIGNING_SECRET`,
      `REVENUECAT_ENTITLEMENT_ID`, `REVENUECAT_ENTITLE_SANDBOX`,
      `REVENUECAT_API_URL`, `THROTTLE_SUBSCRIPTION_SYNC_*`,
      `JOBS_REVENUECAT_*_CRON` у `.env.example` і
      `infra/prod/env.prod.example`; fail-fast у `production` без `live`;
      `scripts/qa-up.sh` примусово `stub` (§10.10, §10.12).

**C. client-api.**

- [ ] `WebhooksModule` + `POST /webhooks/revenuecat`: `@Public()`,
      `@SkipThrottle()`, `rawBody: true`, auth/HMAC зі списками для ротації,
      insert-only, `5xx` якщо вставка не вдалась (§10.2).
- [ ] `POST /subscription/sync { reason }` з бюджетом ≤5 с і відповіддю
      `synced:false` замість `5xx`; `ThrottleKey.SubscriptionSync`; `dev` —
      лише в `stub`, інакше `400` (§10.7, §10.12).
- [ ] Прибрати `POST /subscription/receipt`, `submitReceiptSchema`,
      `SubmitReceiptInboundDto`, `PurchasesModule`/`PurchasesService`/
      `purchasesConfig`, `VerifiedReceipt`/`ReceiptOutcome` і креди
      `APPLE_*`/`GOOGLE_PACKAGE_NAME`/`GOOGLE_SERVICE_ACCOUNT_JSON`
      (§10.8, §10.10).
- [ ] Сповіщення: `NotificationEvent.SubscriptionTransferred` + міграція
      енуму + шаблон у `packages/constants/src/notification-templates.ts`;
      `subscription_cancelled` і `subscription_expired` шле ресинк;
      `subscription_activated` — лише на переході «без доступу → з
      доступом»; дедуп — `notification-dedupe-key.ts` (§10.4 п. 6–7).
- [ ] Startup-перевірка: у `live` один `GET /v1/subscribers` на тестовий id
      має містити `REVENUECAT_ENTITLEMENT_ID` (§10.11).

**D. worker.**

- [ ] `JobName.RevenueCatEvents` (outbox, `every: 20_000`, власні опції
      без ретраїв BullMQ; `user-missing`, `attempts`/`next_attempt_at`,
      `RevenueCatAuthError`), `JobName.RevenueCatReconcile` (30 хв,
      запобіжник 5 % / 20), `JobName.RevenueCatNightly` — `jobs.constants.ts`,
      `JobsConfig`, `JobsScheduler`, три кейси в `JobsProcessor.run()`
      (§10.3, §10.11).
- [ ] Метрики `dns_revenuecat_events_unprocessed` (gauge) і
      `dns_revenuecat_auth_failures_total` у `JobsMetrics` + два правила в
      `infra/prod/grafana/provisioning/alerting/rules.yml` (§10.3).
- [ ] Наявний `subscription-expiry` — без змін.

**E. Тести.** Матриця §10.14 (`SubscriberDto`-білдер спільний зі stub-ом)
+ для §9: ліміт `POST /recipes` під `Promise.all` ×5, три відмови 403,
`isLocked` для підписника й без, `GET /shopping-list` без підписки.

**F. Реліз.** Рунбук `docs/runbooks/configure-revenuecat.md`, кроки C1–C2
до створення вебхука в дашборді; після релізу — H1 (sandbox-рядки закрити
з перенесенням після `REVENUECAT_ENTITLE_SANDBOX=false`).

## Related

- `TODO_FE_RC.md` — мобільна частина RevenueCat і замків
- ADR-0009 `docs/adr/0009-subscriptions-via-revenuecat.md` — рішення (§10)
- `docs/runbooks/configure-revenuecat.md` — дашборди, App Store Connect,
  ключі (§10)
- `apps/client-api/src/modules/subscription/` — `redeemReceipt` → `sync`,
  `EntitlementService` (§10.3, §10.8)
- `packages/database/src/repositories/subscription/subscription.repository.ts`
  — правила заміни з перенесенням, блокування акаунта (§10.3)
- `packages/database/src/schema/subscriptions.schema.ts` — нові колонки і
  таблиці (§10.4)
- `apps/worker/src/jobs/` — `revenuecat-sync`, `revenuecat-reconcile`
  (§10.10)
- `docs/specs/client/subscription/free-tier/spec.md` — що саме замкнено (§9)
- `apps/client-api/src/modules/catalog/recipe.service.ts` — `list`, `detail`,
  `create` (§9.2, §9.3)
- `apps/client-api/src/modules/catalog/catalog.errors.ts`,
  `apps/client-api/src/modules/subscription/subscription.errors.ts` — коди (§9.5)
- `packages/constants/src/subscription.ts` — `FREE_OWN_RECIPES_LIMIT` (§9.3)
- `packages/constants/src/nutrition-formulas.ts` — де живуть формули
- `packages/database/src/schema/nutrition-goals.schema.ts` — таблиця
- `apps/client-api/src/modules/user/onboarding.service.ts` — виклики
- `apps/client-api/src/modules/nutrition/nutrition.service.ts` — денний зріз
- `apps/client-api/src/modules/progress/` — точки й зведення
- ADR-0007 — чинне обґрунтування формул, потребує оновлення
