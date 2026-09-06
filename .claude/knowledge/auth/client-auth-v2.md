# Auth — client API (реалізовано)

> Це опис **чинного** коду в `apps/client-api`, на відміну від решти файлів у
> цій теці, які описують V1 на Supabase і лишаються довідником продуктового
> контракту. Реалізовано 2026-09-06.

## Де живе код

```
apps/client-api/src/modules/auth/
├── auth.controller.ts        # усі маршрути
├── auth.service.ts           # register, verifyEmail, resendEmailCode, login
├── oauth.service.ts          # create-or-link для Apple/Google
├── password-reset.service.ts # request → verify → complete
├── otp.service.ts            # видача і споживання 6-значних кодів
├── otp.mailer.ts             # тексти листів (uk)
├── token.service.ts          # видача, ротація, відкликання токенів
├── auth.errors.ts            # коди в ApiError.code
├── auth.types.ts             # payload-и токенів
├── strategies/jwt.strategy.ts, guards/jwt.guard.ts
└── decorators/{current-user,public}.decorator.ts

packages/database/src/schema/{users,refresh-tokens,otp-codes,password-reset-permits,oauth-identities}.schema.ts
packages/database/src/repositories/{user,refresh-token,otp-code,password-reset-permit,oauth-identity}/
packages/api-infrastructure/src/{email,oauth,otp}/
packages/validation/src/auth.schemas.ts
packages/constants/src/auth-policy.ts
```

Тести: `apps/client-api/test/auth-{oauth,tokens,otp}.db-spec.ts` — `pnpm test:db`
(потрібен запущений `docker compose`).

## Endpoints

База: `http://localhost:3000/api/v1` (`CLIENT_API_PORT`).
Успіх завжди загорнуто в `{ "data": ... }`, помилка — `ApiError`.

| Method | Route                | Auth   | Що робить                                                   |
| ------ | -------------------- | ------ | ----------------------------------------------------------- |
| POST   | `/auth/register`     | public | створює акаунт, шле код; 201 без сесії                      |
| POST   | `/auth/verify-email` | public | підтверджує email, повертає пару токенів                    |
| POST   | `/auth/resend-code`  | public | перевидає код; завжди 204                                   |
| POST   | `/auth/login`        | public | вхід email+пароль                                           |
| POST   | `/auth/oauth`        | public | Apple/Google: вхід, реєстрація і прив'язка одним ендпоінтом |
| POST   | `/auth/refresh`      | public | ротація пари                                                |
| POST   | `/auth/logout`       | public | завершує один ланцюжок; завжди 204                          |
| POST   | `/auth/logout-all`   | Bearer | завершує всі сесії акаунту                                  |
| GET    | `/auth/me`           | Bearer | id, email, emailVerifiedAt                                  |

## Коди помилок (`ApiError.code`)

| Код                          | Статус | Коли                                                                         |
| ---------------------------- | ------ | ---------------------------------------------------------------------------- |
| `auth.email-taken`           | 409    | реєстрація на **підтверджений** акаунт                                       |
| `auth.invalid-credentials`   | 401    | будь-яка невдача входу — одна відповідь на всі                               |
| `auth.email-not-verified`    | 403    | пароль вірний, email не підтверджено; код перевидано                         |
| `auth.invalid-code`          | 400    | невірний / прострочений / спожитий код, вичерпані спроби, адреса без акаунту |
| `auth.invalid-refresh-token` | 401    | невідомий / прострочений / спожитий / підроблений refresh                    |
| `auth.invalid-permit`        | 401    | невідомий / прострочений / спожитий дозвіл на зміну пароля                   |

## Модель даних

- `users` — email (UNIQUE, нормалізований у нижній регістр), `password_hash`
  **nullable** (акаунт через провайдера пароля не має), `email_verified_at`.
- `refresh_tokens` — `id` їде в токені як `jti`; `family_id` сталий у межах
  ланцюжка одного пристрою; `rotated_at` позначає спожитий токен, рядок не
  видаляється.
- `otp_codes` — одна таблиця на обидва флоу, `purpose` = `email_verification`
  \| `password_reset`; bcrypt-хеш, лічильник `attempts`.
- `password_reset_permits` — `id` їде в permit-токені як `jti`; рядок і робить
  дозвіл одноразовим.
- `oauth_identities` — UNIQUE `(provider, provider_user_id)`; звʼязок тримається
  за id провайдера, ніколи за email.

## Що варто знати перед правками

- **Три типи токенів, у кожного явний claim `type`** (`access` | `refresh` |
  `password-reset`), і кожен споживач його перевіряє. Permit підписано
  `JWT_REFRESH_SECRET`, а не ключем access-токенів. Прибрати будь-яку з цих
  перевірок — значить дозволити permit-у відкривати сесію.
- **Порядок перевірок у ротації**: підпис → рядок за `jti` → звірка bcrypt →
  повторне використання → строк дії. Звірка хешу стоїть **перед** перевіркою на
  повтор навмисно: інакше той, хто може підробити токен, відкликав би живий
  ланцюжок жертви.
- **Повтор відкликає один ланцюжок, не всі сесії** — паралельні подовження з
  одного пристрою штатні.
- **`/auth/register` свідомо розкриває існування акаунту** (409), бо spec
  просить дати змогу перейти до входу. `/auth/login` і відновлення паролю,
  навпаки, розкривати нічого не мають — там відповіді уніфіковані, а на вході
  ще й виконується фіктивне bcrypt-порівняння проти таймінг-атаки.
- **Політика в `AUTH_POLICY`** (`packages/constants`), а не в env: пароль ≥ 8
  символів і ≤ 72 **байтів**, ≥ 1 літера і ≥ 1 цифра; код 6 цифр, TTL 10 хв,
  5 спроб. Rate-limit пороги, навпаки, живуть в env.

## Env

`JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`,
`GOOGLE_CLIENT_ID`, `APPLE_CLIENT_ID`, `RESEND_API_KEY` (порожній → stub пише
лист у лог), `EMAIL_FROM`, `OTP_DEV_CODE`, `THROTTLE_*`.

## Specs і рішення

- [`docs/specs/client/auth/`](../../../docs/specs/client/auth) — spec + plan на
  кожну фічу.
- [ADR-0003](../../../docs/adr/0003-auth-model-tokens-and-admin-permissions.md)
  — модель токенів і сесій, окремі `users` / `admins`.
