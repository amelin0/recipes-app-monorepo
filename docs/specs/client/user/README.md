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

| Feature | Status | Owner | Updated |
|---|---|---|---|
| [Profile (Профіль і налаштування)](./profile/spec.md) | Draft | @amelin0 | 2026-08-19 |
| [Profile edit (Редагування профілю)](./profile-edit/spec.md) | Draft | @amelin0 | 2026-08-19 |
| [App settings (Мова, тема, одиниці)](./app-settings/spec.md) | Draft | @amelin0 | 2026-08-19 |
| [Reminders (Нагадування)](./reminders/spec.md) | Draft | @amelin0 | 2026-08-19 |
| [FAQ (Часті питання)](./faq/spec.md) | Draft | @amelin0 | 2026-08-19 |
| [Feedback (Зворотній звʼязок)](./feedback/spec.md) | Draft | @amelin0 | 2026-08-19 |
| [Account deletion (Видалення й відновлення)](./account-deletion/spec.md) | Draft | @amelin0 | 2026-08-20 |
| [Referral program (Реферальна програма)](./referral/spec.md) | Draft | @amelin0 | 2026-08-20 |

## Related

- Код (UI, мок-дані): `apps/mobile/src/view/user/`
- Код (майбутній API): `apps/client-api/src/users/`
- Knowledge (контракти V1, референс): [`.claude/knowledge/user/`](../../../../.claude/knowledge/user)
