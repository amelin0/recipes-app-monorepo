# Notifications (client)

Усе, що застосунок каже користувачеві поза екранами: нагадування про
прийоми їжі, підсумки, системні повідомлення про оновлення та підписку.
Домен покриває список сповіщень у застосунку і детальний перегляд
одного з них; розклад локальних нагадувань налаштовується в профілі
(див. домен user).

Кожна фіча живе у власній папці зі `spec.md` (+ `plan.md`, коли бекенд
бере фічу в роботу).

UI реалізовано в мобільному застосунку з мок-даними (дизайн: Figma
RF-mobile-app) — специфікації фіксують продуктовий контракт для
бекенда.

## Specs

| Feature | Status | Owner | Updated |
|---|---|---|---|
| [Inbox (Сповіщення)](./inbox/spec.md) | Implemented | @amelin0 | 2026-09-11 |
| [Notification producers (Хто пише в інбокс)](./producers/spec.md) | Implemented | @amelin0 | 2026-09-11 |

## Related

- Код (UI, мок-дані): `apps/mobile/src/view/notifications/`
- Код (майбутній API): `apps/client-api/src/notifications/`
- Специфікації: [user/reminders](../user/reminders/spec.md) (розклад
  нагадувань), [user/profile](../user/profile/spec.md) (вхід через
  дзвіночок на головній)
