# Client API — карта шляхів

Виведено за правилами [ADR-0004](../../docs/adr/0004-client-api-url-conventions.md).
База: `EXPO_PUBLIC_API_URL` = `http://localhost:3000/api/v1`; усі шляхи нижче —
відносні до неї.

**Статус позначок:** ✅ реалізовано · ○ виведено з правил, остаточний контракт
фіксує `plan.md` свого зрізу. Розбіжність між цим файлом і `plan.md` завжди
вирішується на користь `plan.md`.

## auth ✅

| Method | Path                            | Спец                                                         |
| ------ | ------------------------------- | ------------------------------------------------------------ |
| POST   | `/auth/register`                | sign-up FR-001…FR-003                                        |
| POST   | `/auth/verify-email`            | sign-up FR-004…FR-007                                        |
| POST   | `/auth/resend-code`             | sign-up FR-006                                               |
| POST   | `/auth/login`                   | sign-in FR-001…FR-003                                        |
| POST   | `/auth/oauth`                   | sign-in FR-004…FR-006                                        |
| POST   | `/auth/refresh`                 | session FR-002                                               |
| POST   | `/auth/logout`                  | session FR-006                                               |
| POST   | `/auth/logout-all`              | session FR-007                                               |
| GET    | `/auth/me`                      | стан автентифікації, не профіль; несе `deletionScheduledFor` |
| POST   | `/auth/password-reset/request`  | password-reset FR-001                                        |
| POST   | `/auth/password-reset/verify`   | password-reset FR-003                                        |
| POST   | `/auth/password-reset/complete` | password-reset FR-004…FR-005                                 |

## profile ✅ (частково)

Синглтон поточного користувача; колекції `/users` у клієнтському API немає.

| Method | Path                        | Статус | Що                                                               |
| ------ | --------------------------- | ------ | ---------------------------------------------------------------- |
| GET    | `/profile`                  | ✅     | агрегат: id, email, імʼя, фото, ініціали + вкладені налаштування |
| PATCH  | `/profile`                  | ✅     | імʼя (фото — після появи сховища)                                |
| PATCH  | `/profile/settings`         | ✅     | мова, тема, 4 системи одиниць; часткове тіло                     |
| GET    | `/profile/reminders`        | ✅     | пʼять карток у порядку показу                                    |
| PUT    | `/profile/reminders`        | ✅     | збереження розкладу як цілого                                    |
| POST   | `/profile/deletion-request` | ✅     | запит на видалення, 30 днів                                      |
| DELETE | `/profile/deletion-request` | ✅     | скасування запиту                                                |
| GET    | `/profile/referral`         | ○      | код + статистика — блокує домен subscription                     |
| POST   | `/profile/feedback`         | ○      | звернення, до 3 зображень — потребує сховища                     |
| GET    | `/profile/onboarding`       | ○      | стан 16-крокової анкети (resume)                                 |
| PUT    | `/profile/onboarding`       | ○      | збереження кроку                                                 |
| GET    | `/profile/recommendations`  | ○      | серверні BMR/TDEE, норми води і кроків                           |

Окремого `GET /profile/settings` навмисно немає: налаштування приходять
вкладеними в `GET /profile`, а два шляхи читання тих самих даних розходяться
першими.

`POST` / `DELETE` на `deletion-request` — та сама симетрія, що в правилі 6
ADR-0004: запит або існує, або ні.

## nutrition ○

| Method    | Path                                | Що                                                               |
| --------- | ----------------------------------- | ---------------------------------------------------------------- |
| GET       | `/nutrition/days/{date}`            | денний зріз: спожите проти цілі, слоти                           |
| GET / PUT | `/nutrition/goal`                   | активна ціль; `PUT`, бо синглтон і апсерт                        |
| POST      | `/nutrition/days/{date}/meals`      | логування страви (порції, зʼїдена частка)                        |
| DELETE    | `/nutrition/days/{date}/meals/{id}` | скасування запису                                                |
| POST      | `/nutrition/days/{date}/water`      | склянка води — запис, а не інкремент, щоб її можна було прибрати |
| DELETE    | `/nutrition/days/{date}/water/{id}` | прибрати склянку                                                 |
| PUT       | `/nutrition/days/{date}/steps`      | кроки за день — заміна значення, не додавання                    |

## recipe ○

| Method | Path                     | Що                                                                        |
| ------ | ------------------------ | ------------------------------------------------------------------------- |
| GET    | `/recipes`               | список; `?tab=all\|favorite\|own`, `?category=`, `?q=`, фільтри, `?page=` |
| GET    | `/recipes/count`         | живий лічильник результатів на екрані фільтрів                            |
| GET    | `/recipes/{id}`          | деталь: інгредієнти, кроки, КБЖВ                                          |
| POST   | `/recipes`               | власна страва (create-dish)                                               |
| PUT    | `/recipes/{id}/favorite` | додати в улюблені                                                         |
| DELETE | `/recipes/{id}/favorite` | прибрати з улюблених                                                      |
| GET    | `/recipes/filters`       | довідники для 5 груп фільтрів                                             |
| GET    | `/ingredients`           | `?q=` — пошук по каталогу                                                 |
| GET    | `/products`              | `?q=` — каталог продуктів (назва, емодзі, категорія, ккал/100 г)          |
| POST   | `/products`              | власний продукт                                                           |

Вкладки — `?tab=`, а не `/recipes/favorites`: це та сама колекція, звужена
фільтром (правило 5).

## meal-plan ○

| Method | Path                               | Що                                           |
| ------ | ---------------------------------- | -------------------------------------------- |
| GET    | `/meal-plan`                       | тиждень; `?week=`                            |
| GET    | `/meal-plan/days/{day}`            | один день                                    |
| POST   | `/meal-plan/days/{day}/items`      | додати страву в слот                         |
| DELETE | `/meal-plan/days/{day}/items/{id}` | прибрати страву                              |
| DELETE | `/meal-plan/days/{day}`            | очистити день                                |
| POST   | `/meal-plan/days/{day}/copy`       | копіювати в інші дні — виняток за правилом 7 |

## shopping-list ○

| Method | Path                        | Що                                             |
| ------ | --------------------------- | ---------------------------------------------- |
| GET    | `/shopping-list`            | список, згрупований по категоріях              |
| POST   | `/shopping-list/items`      | додати вручну **або** з плану — джерело в тілі |
| PATCH  | `/shopping-list/items/{id}` | `{ purchased, quantity }`                      |
| DELETE | `/shopping-list/items/{id}` | прибрати позицію                               |
| DELETE | `/shopping-list/items`      | очистити список                                |
| PATCH  | `/shopping-list`            | `{ importFromPlan: bool }`                     |

Імпорт із плану — це створення позицій, тож `POST /shopping-list/items` із
посиланням на джерело, а не `POST /meal-plan/days/{day}/to-shopping-list`:
ресурс, що змінюється, — список покупок.

## progress ○

| Method | Path                                           | Що                                |
| ------ | ---------------------------------------------- | --------------------------------- |
| GET    | `/progress/metrics`                            | зведення по всіх шести метриках   |
| GET    | `/progress/metrics/{metric}`                   | деталь: записи, min/avg/max, ціль |
| POST   | `/progress/metrics/{metric}/measurements`      | новий вимір                       |
| DELETE | `/progress/metrics/{metric}/measurements/{id}` | прибрати вимір                    |
| PUT    | `/progress/metrics/{metric}/goal`              | ціль по метриці                   |

## notifications ○

| Method | Path                          | Що                                    |
| ------ | ----------------------------- | ------------------------------------- |
| GET    | `/notifications`              | список, згрупований по днях; `?page=` |
| GET    | `/notifications/unread-count` | лічильник для бейджа                  |
| PATCH  | `/notifications/{id}`         | `{ read: true }`                      |
| POST   | `/notifications/read-all`     | масова дія — виняток за правилом 7    |

## subscription ○

| Method | Path                          | Що                                       |
| ------ | ----------------------------- | ---------------------------------------- |
| GET    | `/subscription/plans`         | тарифи: період, ціна, базова ціна, тріал |
| GET    | `/subscription`               | поточний стан підписки                   |
| POST   | `/subscription/receipt`       | валідація чека App Store / Google Play   |
| POST   | `/subscription/referral-code` | застосувати реферальний код              |

## content ○

| Method | Path   | Що                                            |
| ------ | ------ | --------------------------------------------- |
| GET    | `/faq` | теми і питання, редаговані контент-менеджером |

## Що лишилось невизначеним

- Форма пагінації в списках, де специфікації ставлять це відкритим питанням
  (`notifications/inbox`, `progress/metric-detail`). Конверт `PaginatedResponse`
  уже є в `@dns/shared-types`; лишилось вирішити offset чи cursor.
- Чи потрібен `/recipes/count` окремим маршрутом, чи лічильник їде в `meta`
  звичайного `GET /recipes` з `limit=0`.
- Одиниці, у яких клієнт шле воду і вагу: конвертація на сервері чи на клієнті
  (`app-settings` дає чотири незалежні системи одиниць).
