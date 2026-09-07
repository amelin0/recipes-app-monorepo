# Auth (client)

Автентифікація мобільного застосунку: реєстрація з підтвердженням email
(6-значний код), вхід email/пароль + Apple/Google OAuth, відновлення
паролю, сесії з ротацією токенів. Роль за замовчуванням при реєстрації:
USER.

Кожна фіча живе у власній папці зі `spec.md` і `plan.md`.

UI всіх екранів реалізовано в мобільному застосунку з мок-хендлерами
(дизайн: Figma RF-mobile-app). Бекенд реалізовано; підключення застосунку
до живого API — окремий трек.

## Specs

| Feature                                                         | Spec        | Plan                             | Owner    | Updated    |
| --------------------------------------------------------------- | ----------- | -------------------------------- | -------- | ---------- |
| [Sign-up (Реєстрація)](./sign-up/spec.md)                       | Implemented | [plan](./sign-up/plan.md)        | @amelin0 | 2026-09-06 |
| [Sign-in (Вхід)](./sign-in/spec.md)                             | Implemented | [plan](./sign-in/plan.md)        | @amelin0 | 2026-09-06 |
| [Password reset (Відновлення паролю)](./password-reset/spec.md) | Implemented | [plan](./password-reset/plan.md) | @amelin0 | 2026-09-06 |
| [Session (Сесія і токени)](./session/spec.md)                   | Implemented | [plan](./session/plan.md)        | @amelin0 | 2026-09-06 |

## Related

- Код (UI, мок-хендлери): `apps/mobile/src/view/auth/`,
  `apps/mobile/src/shared/services/http.service.ts`
- Код (API): `apps/client-api/src/modules/auth/`,
  `packages/database/src/{schema,repositories}/`,
  `packages/api-infrastructure/src/{email,oauth,otp}/`
- Knowledge (контракти V1, референс): [`.claude/knowledge/auth/`](../../../../.claude/knowledge/auth)
