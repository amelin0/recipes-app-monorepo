# User — Get Me

## Overview

Отримання профілю поточного авторизованого користувача.

## Endpoints

| Role | Method | Route | Auth |
|------|--------|-------|------|
| Client | GET | `/api/users/me` | Bearer token |

## Request

Headers: `Authorization: Bearer <access_token>`

## Response (200)

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "user@example.com",
    "role": "USER",
    "created_at": "2026-03-23T14:01:05.384405+00:00",
    "updated_at": "2026-03-23T14:01:05.384405+00:00"
  }
}
```

## Логіка

### Controller (`src/client/users/user.controller.ts`)
1. Бере `userId` з context (встановлений `authMiddleware`)
2. Викликає `UserService.getMe(userId)`
3. Повертає профіль

### Service (`src/shared/services/user.service.ts`)
1. `supabaseAdmin.from('profiles').select('*').eq('id', userId).single()`
2. Повертає повний рядок з profiles

### Middleware (`src/shared/middleware/auth.middleware.ts`)
1. Витягує Bearer token з Authorization header
2. `supabaseAdmin.auth.getUser(token)` — верифікує JWT
3. Встановлює `userId` та `user` в Hono context
4. Якщо невалідний — 401 Unauthorized

## Зв'язки

- **DB:** `profiles` таблиця
- **Middleware:** `authMiddleware` (обов'язковий)
- **Використовується:** profile screen (mobile), header user info (web)

## Модель Profiles

| Column | Type | Default | Note |
|--------|------|---------|------|
| id | UUID | — | PK, FK → auth.users(id) ON DELETE CASCADE |
| full_name | TEXT | — | NOT NULL |
| email | TEXT | — | NOT NULL, UNIQUE |
| role | user_role | 'USER' | ENUM: USER, ADMIN, SUPER_ADMIN |
| created_at | TIMESTAMPTZ | now() | |
| updated_at | TIMESTAMPTZ | now() | Auto-update via trigger |
