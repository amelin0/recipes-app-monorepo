# User (client)

Профіль користувача: аватар з ініціалами, імʼя та email, підписка
(тариф і дата закінчення), оцінка застосунку, реферальна програма,
зміна пароля, налаштування (нагадування, мова, тема, одиниці виміру —
кожне власним екраном),
підтримка (відгук, FAQ з розділами питань, чат, юридичні документи) і
небезпечна зона
(видалення акаунту, вихід).

Кожна фіча живе у власній папці зі `spec.md` (+ `plan.md`, коли бекенд
бере фічу в роботу).

UI екрана вже реалізовано в мобільному застосунку з мок-даними
(дизайн: Figma RF-mobile-app) — специфікації фіксують продуктовий
контракт для бекенда.

## Specs

| Feature                                                                  | Spec        | Plan                               | Owner    | Updated    |
| ------------------------------------------------------------------------ | ----------- | ---------------------------------- | -------- | ---------- |
| [Profile (Профіль і налаштування)](./profile/spec.md)                    | Approved    | [plan](./profile/plan.md)          | @amelin0 | 2026-09-06 |
| [Profile edit (Редагування профілю)](./profile-edit/spec.md)             | Approved    | [plan](./profile-edit/plan.md)     | @amelin0 | 2026-09-11 |
| [App settings (Мова, тема, одиниці)](./app-settings/spec.md)             | Implemented | [plan](./app-settings/plan.md)     | @amelin0 | 2026-09-06 |
| [Reminders (Нагадування)](./reminders/spec.md)                           | Implemented | [plan](./reminders/plan.md)        | @amelin0 | 2026-09-06 |
| [FAQ (Часті питання)](./faq/spec.md)                                     | Implemented | [plan](./faq/plan.md)              | @amelin0 | 2026-09-07 |
| [Feedback (Зворотній звʼязок)](./feedback/spec.md)                       | Draft       | —                                  | @amelin0 | 2026-08-19 |
| [Account deletion (Видалення й відновлення)](./account-deletion/spec.md) | Approved    | [plan](./account-deletion/plan.md) | @amelin0 | 2026-09-06 |
| [Referral program (Реферальна програма)](./referral/spec.md)             | Approved    | [plan](./referral/plan.md)         | @amelin0 | 2026-09-07 |

`Approved` означає, що серверна частина реалізована не повністю — деталі в
розділі «Що ще не побудовано» відповідного `plan.md`.

## Related

- Код (UI, мок-дані): `apps/mobile/src/view/user/`
- Код (майбутній API): `apps/client-api/src/users/`
- Knowledge (контракти V1, референс): [`.claude/knowledge/user/`](../../../../.claude/knowledge/user)
