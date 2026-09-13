# TODO для фронтенду — підписка через RevenueCat і замки

> Що зробити в `apps/mobile`, щоб оплата підписки йшла через RevenueCat
> (ADR-0009) і замки безкоштовного режиму (`docs/specs/client/subscription/
> free-tier/spec.md`) читали право доступу з сервера. Контракт бекенду —
> `TODO_BE.md` §9–§10; пункти, що впираються в нього, позначені **[BE]**,
> у ключі від власника (рунбук `configure-revenuecat`) — **[keys]**.
>
> Правило, яке не обговорюється (`apps/mobile/CLAUDE.md`): замки — лише по
> `GET /subscription`; `react-native-purchases` — лише купити, відновити і
> смикнути `POST /subscription/sync`. Для реферального користувача SDK каже
> «без підписки», і це правильно.
>
> Факти про SDK і магазини перевірені по документації 13.09.2026; дизайн
> пройшов адверсарне ревʼю — його знахідки вже враховані.

**Останнє оновлення:** 2026-09-13

## 0. Що можна зараз, а що чекає

| Можна зараз, без бекенду і ключів | Потребує |
| --- | --- |
| §1 пакет і збірка, §2 сервіс SDK, §3 типи і стан, §4 пейвол (UI, review-вимоги), §6 success-екран, §8 усі замки (UI + шторка), §9 stub-режим | — |
| §4 реальні offerings/ціни, §10 тестування на пристрої | **[keys]** In-App Purchase Key, продукти в App Store Connect, `appl_`-ключ |
| §5 покупка → `sync`, §7 слухач, `entitlement` у знімку, серверні 403 | **[BE]** `TODO_BE.md` §10.6–10.7, §9 |

Поки бекенд не віддає `entitlement`, замки читають `subscription !== null`
(живий рядок уже є для реферальних місяців) — і тримаються за фіче-флагом
`EXPO_PUBLIC_GATING_ENABLED`, щоб TestFlight-збірку без замків можна було
зібрати будь-коли.

## 1. Пакет і збірка

- `pnpm --filter @dns/mobile add react-native-purchases@10.9.1` — лише ядро;
  `react-native-purchases-ui` не потрібен (пейвол свій) і пінить точну
  версію ядра.
- `cd apps/mobile/ios && pod install`, повна перезбірка dev client. Hot
  reload на старому бінарнику дає `Invariant Violation: new
  NativeEventEmitter() requires a non-null argument`. `ios/` — згенерований
  і в `.gitignore` (`pnpm prebuild` його перестворює), тож жодна зміна не
  може жити лише там. Config-плагіна у пакета немає, `app.json` без змін.
- Expo Go — Preview API Mode з фейковими покупками: не показник.
- RN 0.83.6 / iOS 15.1 проходять вимоги (RN ≥ 0.73, iOS ≥ 13). На iOS 15
  SDK іде через StoreKit 1 — власник вирішує: підняти deployment target до
  16.0 (пропозиція) чи додати App-Specific Shared Secret у RC (рунбук A2б).
  Якщо 16.0 — через `expo-build-properties` в `app.json`
  (`ios.deploymentTarget`), не в `ios/Podfile` (він читає
  `Podfile.properties.json` і регенерується).
- Обидва `.env.example` (кореневий і `apps/mobile/.env.example`):
  `EXPO_PUBLIC_REVENUECAT_IOS_KEY=` (публічний `appl_…`, у бандл; пізніше
  `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`) і `EXPO_PUBLIC_GATING_ENABLED=true`.
  Змінна має бути в оточенні shell, з якого відкрито Xcode для
  TestFlight-збірки — інакше бандл без ключа і мовчки без покупок.
  `test_`-ключ у TestFlight заборонений RC.

## 2. Сервіс SDK — `src/shared/services/purchases.service.ts`

Єдине місце імпорту `react-native-purchases` (+ barrel у
`shared/services/index.ts`).

- `configure(userId)`: `Purchases.setLogLevel(LOG_LEVEL.DEBUG)` у `__DEV__`;
  `Purchases.configure({ apiKey, appUserID: userId })` **один раз** — другий
  виклик не підтримується; `logOut()` не викликати ніколи (породжує
  анонімні id); зміна акаунта — `Purchases.logIn(newUserId)` напряму.
- **Звідки взяти `userId`.** Відповіді входу/реєстрації/OAuth несуть лише
  токени (`AuthTokens`), а `useRestoreSession` бере токен на віру і
  `GET /auth/me` не кличе — id на старті невідомий. Id дає `GET /auth/me`
  (`useGetCurrentUser` в `app/index.tsx`, через який проходить кожен вхід
  і кожен холодний старт): там записати його в SecureStore
  (`AuthStorage`, `data/local/domains/auth/auth-storage.ts`;
  `secure-storage.service.ts` — новий дозволений ключ поруч із `token`).
  Далі: холодний старт — `configure` з SecureStore одразу після
  `useRestoreSession` у `src/app/_layout.tsx`; перший вхід — `configure`,
  щойно `/auth/me` відповів. Без цього покупка, перервана вбивством
  застосунку, не добереться: SDK фінішить відкладену транзакцію лише
  після `configure`.
- Обгортки: `getOfferings()`, `purchasePackage(pkg)`, `restorePurchases()`,
  `checkTrialOrIntroductoryPriceEligibility(ids)`,
  `addCustomerInfoUpdateListener`, `getCustomerInfo()`.
- Помилки — `PURCHASES_ERROR_CODE`; `error.userCancelled` застарів.
- Без ключа в `__DEV__` — stub-режим (§9).

## 3. Дані і стан

- `data/remote/domains/subscription/subscription.types.ts` **[BE §10.6]**:

  ```ts
  export type PeriodType = 'trial' | 'normal' | 'grace' | 'referral';
  export interface Entitlement {
      isSubscribed: boolean;
      activeUntil: string | null;
      source: SubscriptionSource | null;
      periodType: PeriodType | null;
      store: PurchaseStore | null;
      willRenew: boolean;
      environment: 'production' | 'sandbox' | null;
      ownRecipes: { used: number; limit: number | null };
      features: Record<
          | 'lockedRecipes' | 'ownRecipesUnlimited' | 'shoppingListImport'
          | 'copyPlan' | 'addLockedToPlan' | 'progressAnalytics',
          boolean
      >;
  }
  export interface SubscriptionState {
      subscription: Subscription | null;
      paywallPending: boolean;
      entitlement: Entitlement;
      synced: boolean;
      syncedAt: string | null;
      pendingSince: string | null;
  }
  export type SyncReason = 'purchase' | 'restore' | 'listener' | 'foreground';
  ```

  Прибрати `SubmitReceiptPayload`. `user.types.ts`: `Profile.isSubscribed:
  boolean` замість `subscription?: unknown`.
- `subscription.api.ts`: `ENDPOINTS.sync = '/subscription/sync'`,
  `sync: (reason, dev?) => HttpService.post<SubscriptionState>(…)`;
  прибрати `receipt`/`submitReceipt`.
- `state/domains/subscription/hooks/useSyncSubscription.ts`: `useMutation`;
  `onSuccess` → `queryClient.setQueryData(subscriptionKeys.state(), data)` +
  інвалідація `profile`. `useGetSubscription` — без змін (`staleTime` 60 с).
- `useEntitlement()` — селектор над `useGetSubscription`: `features`,
  `ownRecipes`, `isSubscribed`, `isPending`. Поки даних немає — останній
  знімок із MMKV як `placeholderData`: `LocalDataKeys` у
  `storage.service.ts` — закритий union, тож новий фіксований ключ
  `entitlementSnapshot` зі значенням `{ userId, entitlement, savedAt }` і
  перевіркою `userId` при читанні; для нового акаунта — free. React Query
  у памʼяті, а `partialize` стору тримає лише тему/одиниці/анкету, тож без
  цього підписник на холодному старті без мережі бачив би всі замки.
- `FREE_OWN_RECIPES_LIMIT` з `packages/constants` **[BE §9.3]** (ще не
  існує) — лише запасний текст «3/3»; число — з `entitlement.ownRecipes`.
  `catalog.types.ts`: `RecipeCard.isLocked: boolean` (і в деталях)
  **[BE §9.2]**.
- Інвалідація після успішного `sync` або погашення коду: `subscription`,
  `profile`, `recipes`, `recipe`, `shopping-list`, `meal-plan`,
  `progress-metrics`, `progress-metric` (`progressKeys`) — замки зникають
  без перезапуску (free-tier SC-003 ≤ 5 с). `SubmitReceiptPayload`
  прибрати і з барела `data/remote/domains/subscription/index.ts`.

## 4. Пейвол — `src/view/subscription/paywall/`

- **Пакет ↔ план**: `offerings.current.availablePackages.find(p =>
  p.product.identifier === plan.appleProductId)` — не за `$rc_annual`, щоб
  не залежати від назв пакетів у дашборді. `useGetPlans()` лишається
  джерелом назв і бейджа економії.
- **Ціна**: `product.priceString` (локалізована магазином); поки offerings
  не прийшли — `priceCents` із сервера. `subscription.helpers.ts
  formatPrice` друкує «$ 59,99» з пробілом — макет «$59,99»; прибрати
  пробіл. Сума за період — найпомітніша ціна на екрані; «$5/міс» для
  річного — лише підписом (Apple 3.1.2, Google policy; paywall FR-018).
- `offerings.current` порожній → плани показуємо, кнопка «Магазин
  тимчасово недоступний», реферальний шлях працює.
- **Пробний період** (paywall US4, сценарій 2): **[keys]**
  `checkTrialOrIntroductoryPriceEligibility([annualProductId])`; `ELIGIBLE`
  → перемикач увімкнений і замкнений на річному плані, підпис
  `disclaimer-trial` («7 днів безкоштовно, далі $59,99/рік, автоматично»);
  `INELIGIBLE` / `UNKNOWN` (свіжа пісочниця) / `NO_INTRO_OFFER_EXISTS` →
  перемикач схований, копія без trial. Apple застосовує offer сама — стан
  «річний без пробного» для того, хто має право, недосяжний.
- **Варіант із замка** (paywall US5, FR-016–017): route param
  `from: 'onboarding' | 'lock' | 'profile'` (`useLocalSearchParams`).
  Хто передає: `useSetupRemindersScreen.ts` (два `router.replace` →
  `onboarding`), `useProfileScreen.ts` `handleSubscription` → `profile`,
  шторка замків → `lock`. `from !== 'onboarding'` → `CircleIconButton` із
  `close.svg` замість «Пропустити», заголовок «Розблокуй всі можливості,
  щоб досягти цілей.» (`paywall.title-locked`, дослівно як у US5), новий
  `handleClose` → `router.back()`, **без** `dismissPaywall`. Наявний
  `handleSkip` лишається і рендериться лише для `onboarding`.
  `_layout.tsx`: `gestureEnabled: false` лишається для
  onboarding; для `lock`/`profile` дозволити свайп (опція через params або
  окремий route `paywall-locked`).
- **Вимоги App Review** (paywall FR-018): кнопка «Відновити покупки» →
  `restorePurchases()` **лише з тапу** → `sync('restore')` → якщо
  `entitlement.store !== 'none'` — «Покупки відновлено» + інвалідація,
  інакше «Покупок не знайдено» (реферальний рядок — не відновлення);
  посилання «Умови використання» і «Політика конфіденційності»
  (`Linking.openURL`, URL — від власника, ті самі в App Store Connect);
  речення про автопоновлення. Місце в макеті — питання дизайнеру, поки —
  під підписом до кнопки.
- Підписник у профілі → «Підписка»: поки немає екрана керування, пейвол
  показує стан «Підписка активна до …» замість планів (paywall Open
  Questions).
- Локалізація `uk/subscription.json`: прибрати `paywall.store-pending`;
  додати `paywall.title-locked`, `paywall.restore`, `paywall.restored`,
  `paywall.restore-none`, `paywall.legal.terms`, `paywall.legal.privacy`,
  `paywall.auto-renew`, `paywall.store-unavailable`, `paywall.activating`,
  `paywall.activating-hint`, `paywall.transfer-confirm`. Без рядків у JSX.

## 5. Покупка — `usePaywallScreen.handleSubscribe` **[BE §10.7]**

- Реферальна гілка (`appliedCode && isFree` → `redeemCode`) без змін.
- Платна: `lock.acquire()` → `purchasePackage(pkg)` → успіх →
  `sync('purchase')` → `setQueryData` знімком → `router.replace
  ('/(app)/subscription-success', { from, priceString, currencyCode, code })`
  — `code` лишається (success читає його для позначки «Реф. код»). Ціна
  на success — та, що показав магазин (display-only params); дати
  (`startedAt`, `expiresAt`, `daysRemaining`) — як і зараз, із
  `GET /subscription`.
- `synced: false` у відповіді або `sync` впав (мережа, таймаут 30 с) — **не
  помилка**: success-екран у стані «Активуємо підписку…», поллінг
  `GET /subscription` кожні 3 с до 60 с (вікно вебхука), далі підказка
  «зʼявиться за кілька хвилин, ми надішлемо сповіщення»; повтор
  `sync('foreground')` на кожному foreground, поки `!isSubscribed &&
  !synced`. Людина щойно заплатила — червоний тост тут заборонений.
- Замок дії після успішного `purchasePackage` **не відпускати** у покупку:
  повторний тап повторює `sync`, не `purchasePackage`.
- Мапа помилок `purchasePackage`:
  - `PURCHASE_CANCELLED_ERROR` → мовчки, `lock.release()`;
  - `NETWORK_ERROR` / `STORE_PROBLEM_ERROR` / `PAYMENT_PENDING_ERROR` →
    «Оплата обробляється, доступ зʼявиться автоматично» (info, не error):
    гроші могли списати, SDK допостить чек сам, слухач (§7) добере;
  - `PRODUCT_ALREADY_PURCHASED_ERROR` → `sync('purchase')` — можливий
    TRANSFER з іншого акаунта;
  - решта → `ToastService.error` + `lock.release()`.
- **Другий акаунт на тому самому Apple ID.** Перед шторкою Apple: якщо
  `customerInfo.activeSubscriptions` непорожній, а сервер каже
  `entitlement.store === 'none'` / `!isSubscribed` — `ConfirmSheet` «Ця
  підписка Apple ID вже привʼязана до іншого акаунта RationFit.
  Перенести?» — перенесення має бути свідомим (ADR-0009, Decision 6).

## 6. Success — `src/view/subscription/subscription-success/`

- `from` → «Готово»: `onboarding` → `router.replace('/(app)/(tabs)/home')`
  (як зараз); `lock`/`profile` → повернутись на екран, з якого відкрито
  пейвол (`router.dismissTo`/`back` до нього), де замок уже знято (paywall
  FR-014).
- Ціна — з params магазину; `pricePaidCents === 0` → «Безкоштовно», як
  зараз (trial, реферал).
- Стан «Активуємо…» (§5) — той самий екран, без дат до підтвердження.

## 7. Слухач і foreground **[BE §10.7]**

- `addCustomerInfoUpdateListener` у сервісі. Порівнювати з **серверним**
  знімком, не з попереднім викликом (перший виклик після `configure` не
  має «попереднього»): `sync('listener')`, коли (а) SDK має
  `entitlements.active[pro]`, а сервер — не магазинний рядок; (б)
  `expirationDate` у SDK пізніший за `activeUntil` магазинного рядка; (в)
  сервер має магазинний рядок, а SDK — без активного (перенесення).
  Дебаунс 2 с. Це і є шлях для покупки, перерваної вбивством застосунку.
- `AppState → active`: у `query-client.service.ts` уже є слухач із
  `APP_FOCUS_QUERIES: Queries[] = []` — додати туди `Queries.Subscription`
  замість другого слухача; `sync('foreground')` — окремий ефект, лише поки
  pending (§5).
- Шторка «Потрібна підписка» відкрита, а стан став підписаним (оплата з
  іншого пристрою) — закрити її (free-tier edge case).

## 8. Замки (spec free-tier) — читають `useEntitlement().features`

- **Спільна шторка «Потрібна підписка»** — новий компонент
  `shared/ui/components/sheets/SubscriptionSheet.tsx` (або route
  `/(app)/subscription-required?feature=…` як `formSheet` у
  `_layout.tsx`): заголовок — назва дії, `CircleIconButton` close, маскот
  із замком «ПІДПИСКА» 164×164 (нового ассету в `assets/images/brand/`
  немає — запросити експорт у дизайнера; тимчасово `mascot-shrug.svg` +
  `lock.svg`), текст, `AppButton` «Розблокувати всі можливості» →
  `router.push('/(app)/paywall', { from: 'lock' })`. Хрестик — без
  побічних ефектів (SC-004). `uk/subscription.json` `locks.*`: `cta`
  («Розблокувати всі можливості»), `close-a11y`, і по `title`/`body` для
  `create-dish`, `add-to-plan`, `shopping-import`, `copy-plan`, `progress`
  (тексти free-tier FR-007 дослівно). `ConfirmSheet` не підходить: дві
  обовʼязкові кнопки, без ілюстрації.
- **Картка рецепта** `view/recipe/components/RecipeCard.tsx`: `recipe.
  isLocked` **[BE §9.2]** → затемнення фото (`ImageBackground` уже
  окремий елемент; `padding` на ньому заважає full-bleed скриму — перенести
  padding на `imageOverlayRow`), `lock.svg` + пігулка «Розблокувати»; час,
  серце, назва, ккал, БЖВ — без змін; `overflow: hidden` картки вже
  обрізає по радіусу. Тап → пейвол `from: 'lock'` (free-tier Q-2 відкрите;
  до відповіді — пейвол, не деталі). Серце працює (Q-7). Те саме в режимі
  списку і на «Улюблених».
- **Рядок у пікері і пошуку** (`view/meal-plan/add-dish/`,
  `view/recipe/recipe-search/`): рядки — `PickRow` з пропом `emoji`
  (`DISH_FALLBACK_EMOJI`), тож потрібен новий проп/варіант `locked`, що
  малює темну плитку з `lock.svg` замість емодзі; «+» → шторка «Додати до
  раціону»; тап по рядку — як картка. Гліф скрізь один — `lock.svg`
  (`lock-circle.svg` не чіпаємо).
- **Власні страви, три входи**: `useRecipesListScreen.handleAddRecipePress`,
  `useAddDishScreen.handleCreateDish` (вкладка «Створити» і кнопка
  порожнього стану) — `ownRecipes.limit !== null && used >= limit` → шторка
  «Створити страву» з «{used}/{limit}» замість форми; `useCreateDishScreen`
  `onError`: 403 `catalog.own-recipes-limit` → та сама шторка (форма могла
  бути відкрита до вичерпання на іншому пристрої).
- **Список покупок** `useShoppingListScreen`: `!features.shoppingListImport`
  → перемикач `addFromPlan` вимкнений і замкнений (тап → шторка «Додати
  продукти з плану»); стан не змінюється; бейдж таба рахує лише ручні —
  сервер уже віддає без позицій плану **[BE §9.4]**.
- **План** `useMealPlanScreen.handleCopyPlan`: `!features.copyPlan` →
  шторка «Копіювати раціон до інших днів» замість `/(app)/copy-plan`.
- **Прогрес** `view/progress/progress-overview/` і `metric-detail/`:
  компонент `LockedOverlay` (напівпрозорий шар, `lock.svg`, «Розблокувати
  з підпискою»; варіант без підпису для маленьких плиток на екрані
  показника) над числами/графіком/записами; шапка, стрілка, «Змінити ціль»,
  «Сповіщення», «+» — поза шаром і живі; тап по шару → шторка «Прогрес».
  Дані не запитувати: `GET /progress/metrics*` без підписки відповідає 403
  **[BE §9.4]** — у `state/domains/progress/hooks/useProgress.ts`
  (`useGetProgressMetrics`, `useGetProgressMetric`) `enabled:
  isAuthenticated && features.progressAnalytics`.
- **Серверні відмови**: `shared/utils/api-error.ts` уже дає
  `apiErrorCode()`/`apiErrorStatus()` (HttpService відхиляє `{ code,
  message, statusCode }`); 403 `subscription.required` (`feature` у тілі —
  додати в `ApiError`), `catalog.recipe-locked`, `catalog.own-recipes-limit`
  → шторка відповідної дії, не `common:states.error`. Тіла `{ used, limit }`
  у відмові немає — число для «3/3» береться зі знімка. Мапа `feature` →
  шторка збігається з ключами `entitlement.features`.
- Після зняття замка дію **не** виконувати за користувача (free-tier
  FR-015): він повторює тап сам.
- Замкнена картка/рядок/шар для підписника не рендериться взагалі
  (FR-018): один `useEntitlement`, жодних локальних таблиць «що замкнено».

## 9. Dev-режим і stub

- `__DEV__` без `EXPO_PUBLIC_REVENUECAT_IOS_KEY`: `purchases.service` SDK не
  конфігурує; «покупка» шле `POST /subscription/sync { reason: 'purchase',
  dev: { productId, periodType: 'TRIAL' | 'NORMAL', expiresAt, store:
  'apple', isSandbox: true } }` — стенд у `REVENUECAT_MODE=stub` приймає
  (`TODO_BE.md` §10.12), у `live` відповість `400`. Гілка під `__DEV__`,
  у релізний бандл не потрапляє.
- До появи §10 на стенді ця гілка не працює — тоді ручне тестування замків
  через `subscription !== null` (погасити реферальний код на тестовому
  акаунті — живий рядок є).

## 10. Тестування **[keys]**

| Де | Що дає | Чого не дає |
| --- | --- | --- |
| Симулятор + `.storekit` (синхронізований з ASC) у дубльованій схемі Xcode, запуск лише з Xcode, сертифікат завантажений у RC | UI пейволу, скасування, trial-копія | нічого не доходить до сервера й вебхуків; `expo run:ios`/argent файл ігнорують |
| Фізичний iPhone, dev-збірка, Settings → Developer → Sandbox Apple Account | справжній StoreKit 2 → RC → вебхук → наш сервер; рік → 1 год, місяць → 5 хв, до 12 поновлень | ціни/валюта в пісочниці неправильні — перевіряти структуру, не рядки |
| TestFlight (ручна Xcode-збірка) | шлях покупки з production Apple ID | поновлення раз на 24 год ×6 — expiry не перевірити |

Матриця: покупка річного з trial → замки зникли ≤ 5 с; скасування в шторці
Apple → нічого; мережа вимкнена одразу після шторки → «обробляється» →
слухач добрав; «Відновити» на новому пристрої; другий акаунт на тому ж
Apple ID → перенесення + сповіщення першому; реферальний місяць, потім
покупка → дата = кінець оплаченого + залишок; 12 поновлень у пісочниці →
`EXPIRATION` → замки повернулись, дані на місці. У RC ліміт 100 чеків на
клієнта — ротувати sandbox-акаунти. argent 0.25 уміє фізичний iPhone
(`launch-app` першим).

## 11. Перед сабмітом

- Пейвол: назва підписки, тривалість, сума за період найпомітніша, текст
  trial, «Відновити покупки», Terms/Privacy на екрані і в App Store Connect
  (EULA, Privacy Policy URL); у Review Notes — sandbox-акаунт і що замкнено
  без підписки.
- Перша підписка і група подаються разом із версією застосунку (рунбук
  F) — версія з пейволом і є та версія.
- `REVENUECAT_ENTITLE_SANDBOX=false` після релізу — TestFlight-тестери
  втратять Premium; попередити.

## 12. Порядок

1. §1 → §2 → §3 (пакет, сервіс, типи, `useEntitlement`, MMKV-знімок).
2. §4 пейвол: `from`-варіант, restore, legal, ціни, trial-перемикач.
3. §8 замки — паралельно з 2, за фіче-флагом, на `subscription !== null`.
4. §5–§7 після **[BE]** §10.6–10.7 на стенді.
5. §10 на фізичному iPhone після **[keys]**; §9 — щойно стенд у `stub`.
6. §11.

## Related

- `TODO_BE.md` §9–§11 — контракт бекенду
- ADR-0009 `docs/adr/0009-subscriptions-via-revenuecat.md`
- `docs/runbooks/configure-revenuecat.md` — ключі, дашборд, StoreKit config
- `docs/specs/client/subscription/paywall/spec.md` — US4 (trial), US5
  (варіант із замка), FR-014, FR-016…FR-019
- `docs/specs/client/subscription/free-tier/spec.md` — що замкнено, тексти
  шторок, Q-1…Q-10
- `apps/mobile/CLAUDE.md` — правило «замки лише по `GET /subscription`»
