---
spec: ./spec.md
status: Implemented
owner: '@amelin0'
created: 2026-09-06
updated: 2026-09-06
related-adrs: [ADR-0004]
related-runbooks: []
---

# Plan: Reminders (Нагадування)

## Summary

FR-001, FR-002, FR-004, FR-005 і FR-006 лягають на таблицю `user_reminders` і
пару `GET` / `PUT /profile/reminders`. FR-003 (колесо вибору часу, одночасно
відкрите лише одне) — цілком клієнтський.

FR-006 виконується структурно: анкета онбордингу і екран профілю читають і
пишуть **ті самі рядки**, тож розійтися їм нема як.

## Database

### Table `user_reminders`

| Column                      | Type            | Constraints                                                            |
| --------------------------- | --------------- | ---------------------------------------------------------------------- |
| `id`                        | `uuid`          | PK                                                                     |
| `user_id`                   | `uuid`          | NOT NULL, FK → `users.id` ON DELETE CASCADE                            |
| `type`                      | `reminder_type` | NOT NULL — `breakfast` \| `lunch` \| `dinner` \| `snack` \| `weigh_in` |
| `enabled`                   | `boolean`       | NOT NULL, default `true`                                               |
| `time_of_day`               | `time`          | NULL для зважування                                                    |
| `periodicity_days`          | `integer`       | NULL для прийомів їжі                                                  |
| `next_fire_at`              | `timestamptz`   | NULL для прийомів їжі                                                  |
| `created_at` / `updated_at` | `timestamptz`   | NOT NULL, `now()`                                                      |

Indexes:

- `user_reminders_user_type_unique` UNIQUE on `(user_id, type)` — карток рівно
  пʼять, по одній на тип.

**`time`, а не `timestamptz`.** «Сніданок о 8:00» має лишитися о 8:00, коли
людина полетить в інший часовий пояс; момент часу тут був би неправильною
абстракцією.

**Періодичність зважування — число днів, а не enum.** Дизайн називає рівно одне
значення («Кожні 2 тижні»), а специфікація лишає редагованість відкритим
питанням — enum довелося б вигадувати разом з рештою його членів.

**Пʼять рядків створюються при реєстрації** з дефолтами з анкети (8:00 / 11:00
/ 14:00 / 21:00, усі увімкнені; зважування — кожні 14 днів). Альтернатива —
синтезувати дефолти на читанні — залишила б майбутній планувальник сповіщень
без таблиці, яку можна просто обійти запитом.

## API contract

### `GET /profile/reminders`

**Auth:** `JwtGuard` (Bearer)

**Response 200** — завжди пʼять карток, у порядку показу (сніданок, перекус,
обід, вечеря, зважування):

```json
{
    "data": [
        { "type": "breakfast", "enabled": true, "time": "08:00", "periodicityDays": null, "nextFireAt": null },
        {
            "type": "weigh_in",
            "enabled": true,
            "time": null,
            "periodicityDays": 14,
            "nextFireAt": "2026-09-20T14:00:00.000Z"
        }
    ]
}
```

Порядок задає сервер, а не клієнт: інакше дві поверхні, що читають ті самі
картки, могли б показати їх у різній послідовності.

### `PUT /profile/reminders`

**Auth:** `JwtGuard` (Bearer)

**Request body:**

```json
{ "reminders": [{ "type": "breakfast", "enabled": true, "time": "07:30" }] }
```

| Field     | Type    | Validation                                                               |
| --------- | ------- | ------------------------------------------------------------------------ |
| `type`    | enum    | один із пʼяти                                                            |
| `enabled` | boolean | обовʼязково                                                              |
| `time`    | string  | `HH:mm`; **обовʼязково** для прийомів їжі, **заборонено** для зважування |

**Response 200:** усі пʼять карток після збереження.

**Errors:**

- `422` — прийом їжі без часу, зважування з часом, повторений тип, час не у
  форматі `HH:mm` або поза добою.
- `401`.

**`PUT`, а не `PATCH`:** екран зберігає розклад цілком («Зберегти зміни»), тож
запит замінює його, а не править точково. Картки, яких немає в тілі, лишаються
як були — тіло описує те, що екран міг змінити.

**Кожен тип не більше разу.** Два патчі для сніданку зробили б результат
залежним від порядку елементів у масиві.

**Періодичність зважування тут не редагується** (FR-004): патч для нього несе
лише `enabled`, а `periodicity_days` і `next_fire_at` лишаються недоторканими,
а не скидаються.

**Хвилини не обмежені кроком у пʼять.** Колесо дизайну ходить пʼятірками, але
це справа пікера: серверна перевірка кроку зламалася б тієї миті, коли дизайн
передумає.

## Environment variables

Власних не додає.

## File structure

```
apps/client-api/src/modules/user/reminders.controller.ts
apps/client-api/src/modules/user/reminders.service.ts
apps/client-api/src/modules/user/dto/outbound/reminder.view.ts
packages/database/src/schema/user-reminders.schema.ts
packages/database/src/entities/user-reminder.entity.ts
packages/database/src/repositories/user-reminder/
packages/validation/src/user.schemas.ts                  # updateRemindersSchema
packages/constants/src/user-defaults.ts                  # MEAL_REMINDER_DEFAULTS
```

## Shared contract

- `@dns/shared-types` — `ReminderType`, `MEAL_REMINDER_TYPES`.
- `@dns/validation` — `updateRemindersSchema`, `timeOfDaySchema`.
- `@dns/constants` — `MEAL_REMINDER_DEFAULTS`,
  `WEIGH_IN_PERIODICITY_DAYS_DEFAULT`, `REMINDER_MINUTE_STEP`.

## Security & edge cases

- Усі патчі застосовуються в одній транзакції: екран зберігається як ціле, і
  часткове збереження лишило б користувача перед розкладом, наполовину новим.
- Рядки оновлюються, ніколи не вставляються — кожен акаунт отримує свої пʼять
  при реєстрації, тож відсутній тип означає баг, а не перше збереження.
- Патч застосовується лише до рядків власника токена.

## Rollout

- Feature flag: немає.
- Порядок: БД-міграція → деплой `client-api` → реліз застосунку.
- Перереєстрація локальних сповіщень (FR-005) відбувається на клієнті після
  успішного `PUT`.

## Verification

- `packages/validation/src/user.schemas.test.ts` — прийом їжі без часу,
  зважування з часом, дубльований тип, межі `HH:mm`.
- `apps/client-api/test/user-profile.db-spec.ts` — збереження як цілого і
  збереження періодичності зважування при вимкненні.
- Смоук: `GET /profile/reminders` одразу після реєстрації має віддати пʼять
  увімкнених карток із дефолтними часами.

## Що ще не побудовано

Серверних push-сповіщень немає — розклад зберігається, а нагадування показує
локальний планувальник застосунку. Коли зʼявиться серверна доставка, вона
читатиме `next_fire_at` і `time_of_day` із цієї ж таблиці.

## Related

- Spec: [./spec.md](./spec.md)
- ADRs: [ADR-0004](../../../../adr/0004-client-api-url-conventions.md)
