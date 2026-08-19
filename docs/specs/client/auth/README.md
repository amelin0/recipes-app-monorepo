# Auth (client)

Автентифікація мобільного застосунку: реєстрація з підтвердженням email
(6-значний код), вхід email/пароль + Apple/Google OAuth, відновлення
паролю, сесії з ротацією токенів. Роль за замовчуванням при реєстрації:
USER.

Кожна фіча живе у власній папці зі `spec.md` (+ `plan.md`, коли бекенд
бере фічу в роботу).

UI всіх екранів уже реалізовано в мобільному застосунку з мок-хендлерами
(дизайн: Figma RF-mobile-app) — специфікації фіксують продуктовий
контракт для бекенда.

## Specs

| Feature | Status | Owner | Updated |
|---|---|---|---|
| [Sign-up (Реєстрація)](./sign-up/spec.md) | Draft | @amelin0 | 2026-08-18 |
| [Sign-in (Вхід)](./sign-in/spec.md) | Draft | @amelin0 | 2026-08-18 |
| [Password reset (Відновлення паролю)](./password-reset/spec.md) | Draft | @amelin0 | 2026-08-19 |
| [Session (Сесія і токени)](./session/spec.md) | Draft | @amelin0 | 2026-07-18 |

## Related

- Код (UI, мок-хендлери): `apps/mobile/src/view/auth/`,
  `apps/mobile/src/shared/services/http.service.ts`
- Код (майбутній API): `apps/api/src/client/auth/`
- Knowledge (контракти V1, референс): [`.claude/knowledge/auth/`](../../../../.claude/knowledge/auth)
