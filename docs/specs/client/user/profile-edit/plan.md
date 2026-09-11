---
spec: ./spec.md
status: Implemented
owner: '@amelin0'
created: 2026-09-06
updated: 2026-09-11
related-adrs: [ADR-0004]
related-runbooks: []
---

# Plan: Profile edit (Редагування профілю)

## Summary

FR-003 і FR-005 (редагування імені й похідних ініціалів) покриває
`PATCH /profile`. FR-006 (фото замість ініціалів) — той самий `PATCH` із
`photoUrl`, отриманим від `POST /uploads`: байти йдуть напряму в сховище, API
лише видає дозвіл і перевіряє, що посилання належить цьому користувачеві.
FR-001, FR-002, FR-004 (неактивна кнопка при порожньому полі) — клієнтські.

## Database

Таблиця `profiles` описана в [`../profile/plan.md`](../profile/plan.md).
Колонка `photo_url` зберігає публічний URL об'єкта у сховищі; `NULL` —
аватар з ініціалами.

## API contract

### `PATCH /profile`

**Auth:** `JwtGuard` (Bearer)

**Request body:**

```json
{ "name": "Олег Чередник" }
```

| Field            | Type           | Required                           | Validation                                        |
| ---------------- | -------------- | ---------------------------------- | ------------------------------------------------- |
| `name`           | string         | ні, але тіло не може бути порожнім | обрізається, 1–100 символів після обрізання       |
| `photoUrl`       | string \| null | ні                                 | URL, отриманий цим користувачем з `POST /uploads` |
| `targetWeightKg` | number \| null | ні                                 | 30–250; `null` знімає ціль                        |

**Response 200:** повний `ProfileView` — той самий, що віддає `GET /profile`,
щоб екран, який повертається назад, не робив другий запит по оновлені
ініціали.

**Errors:**

- `422` — порожнє тіло, порожнє чи саме з пробілів імʼя, довше за 100 символів.
- `400` — `photoUrl` не з нашого сховища, чужий або вивантажений для іншої
  мети (не `profile-photo`).
- `401`.

### Фото: `POST /uploads` → PUT у сховище → `PATCH /profile`

1. `POST /uploads` з `{ scope: "profile-photo", fileName, contentType, size }`
   повертає `uploadUrl` (підписаний PUT), `publicUrl` і заголовки.
2. Клієнт вантажить байти напряму на `uploadUrl`. **Розмір вшито в підпис** —
   оголошений і фактичний мусять збігатися, інакше сховище відповідає
   непрозорим 403.
3. `PATCH /profile` з `{ "photoUrl": "<publicUrl>" }`; `null` повертає
   ініціали.

**Посилання приймається, лише якщо цей користувач вивантажив його для цієї
мети.** Ключ об'єкта має форму `users/<id>/<scope>/…`, тож перевірка — це
порівняння префікса (`StorageService.validateOwnership`). Без неї `photoUrl`
дозволив би записати в профіль будь-яку адресу, яку потім завантажував би
кожен, хто бачить аватар.

**Порожнє імʼя — 422, а не мовчазне збереження.** Кнопка «Зберегти зміни»
неактивна, поки поле порожнє (FR-004), тож порожнє значення не приходить від
екрана: воно означає баг або запит, написаний руками, і обидва заслуговують на
явну відмову.

**Цільова вага редагується тут, хоч її і показує екран прогресу.** Вона
лежить у `profiles.target_weight_kg` з анкети, і фасад під `/progress`, який
писав би в ту саму колонку, дав би одному числу двох власників
([../../progress/metric-logging/plan.md](../../progress/metric-logging/plan.md)).
Схема та сама, що в анкеті, щоб два шляхи до однієї колонки не мали різних
уявлень про допустиме.

**Ліміт у 100 символів** специфікацією не заданий; узятий як розумна межа, щоб
колонка й екран мали передбачуваний максимум.

## Environment variables

Власних не додає. Фото використовує `S3_*` сховища (у тому числі
`S3_MAX_FILE_SIZE` і `S3_ALLOWED_MIME_TYPES`), спільні з вкладеннями
звернень.

## File structure

```
apps/client-api/src/modules/user/profile.controller.ts       # PATCH /profile
apps/client-api/src/modules/user/profile.service.ts          # validateOwnership перед записом photoUrl
apps/client-api/src/modules/uploads/uploads.controller.ts    # POST /uploads
packages/api-infrastructure/src/storage/storage.service.ts   # presign, validateOwnership
packages/validation/src/user.schemas.ts                      # updateProfileSchema, displayNameSchema
packages/database/src/entities/profile.entity.ts             # initials()
```

## Shared contract

- `@dns/validation` — `displayNameSchema`, `updateProfileSchema`. Мобільний
  застосунок переюзає їх у формі, тож «порожнє імʼя» означає те саме на обох
  боках.

## Security & edge cases

- Нормалізація (обрізання пробілів) живе **лише** у схемі. Сервіс приймає вже
  нормалізоване значення, і дублювати `.trim()` у ньому означало б завести два
  місця, які можуть розійтися.
- Профіль оновлюється тільки для власника токена.
- **Попереднє фото зі сховища не видаляється.** Заміна аватара лишає старий
  об'єкт на місці; прибирання осиротілих файлів — окрема задача, не частина
  цієї фічі.
- **Сервер не перевіряє, що файл справді вивантажено.** Він перевіряє лише
  власника й мету ключа; якщо клієнт надіслав `publicUrl`, не завершивши PUT,
  аватар вказуватиме на відсутній об'єкт — і це видно лише самому автору.

## Rollout

- Feature flag: немає.
- Порядок: деплой `client-api` → реліз застосунку. Міграції не потрібно —
  колонки вже є.

## Verification

- `packages/validation/src/user.schemas.test.ts` — обрізання, відмова
  порожньому імені.
- `apps/client-api/test/user-profile.db-spec.ts` — ініціали з двох слів, з
  одного, і їх відсутність, поки імʼя не задане.
- `packages/api-infrastructure/src/storage/storage.service.test.ts` —
  перевірка власника і мети ключа; `apps/client-api/test/user-feedback.db-spec.ts`
  — посилання, вивантажене як `profile-photo`, не проходить як вкладення
  звернення (та сама перевірка з іншого боку).
- Смоук: `PATCH /profile` з іменем із двох слів має повернути ініціали з двох
  великих літер. Фото перевірено наскрізно на MinIO: presign → PUT → GET,
  байти ідентичні.

## Що ще не побудовано

Серверна частина фічі закрита. Відкриті питання специфікації (джерело фото,
обрізка, попередження про незбережені зміни) — клієнтські: ліміти розміру й
формату вже накладає сховище при видачі дозволу.

## Related

- Spec: [./spec.md](./spec.md)
- Plan (сама таблиця і читання): [../profile/plan.md](../profile/plan.md)
- ADRs: [ADR-0004](../../../../adr/0004-client-api-url-conventions.md)
