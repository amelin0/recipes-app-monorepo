# Auth — Register

> ⚠️ Описує **V1 на Supabase**, який замінено. Чинний клієнтський auth —
> [`client-auth-v2.md`](./client-auth-v2.md). Цей файл лишається як
> довідник продуктового контракту.

## Overview

Реєстрація нового користувача. Доступна тільки для client (мобільний додаток). Адміни створюються вручну або через SUPER_ADMIN.

## Endpoints

| Role   | Method | Route                | Auth   |
| ------ | ------ | -------------------- | ------ |
| Client | POST   | `/api/auth/register` | Public |

## Request

```json
{
    "email": "user@example.com",
    "password": "password123",
    "full_name": "John Doe"
}
```

**Validation:** email, password, full_name обов'язкові.

## Response (201)

```json
{
    "success": true,
    "data": {
        "access_token": "",
        "refresh_token": "",
        "user": {
            "id": "uuid",
            "email": "user@example.com",
            "full_name": "John Doe",
            "role": "USER"
        }
    }
}
```

**Примітка:** access_token та refresh_token пусті поки email не підтверджений (email confirmation увімкнений в Supabase).

## Логіка

### Controller (`src/client/auth/auth.controller.ts`)

1. Валідація email + password + full_name
2. Викликає `AuthService.register()`
3. Повертає 201 з user data

### Service (`src/shared/services/auth.service.ts`)

1. `supabaseAdmin.auth.signUp({ email, password, options: { data: { full_name } } })`
2. Тригер `on_auth_user_created` автоматично створює запис в `profiles` з full_name та role = 'USER'
3. Формує відповідь

## Зв'язки

- **DB:** `auth.users` → тригер `handle_new_user()` → `profiles` (auto-insert)
- **Roles:** завжди створюється з role = `USER`
- **Middleware:** не потрібен (публічний endpoint)
- **Тригер:** `on_auth_user_created` — бере `full_name` з `raw_user_meta_data`, email з `auth.users`
