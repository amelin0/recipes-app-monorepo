# Auth — Login

## Overview

Аутентифікація користувача за email + password. Існує для обох ролей: client (мобільний додаток) та admin (веб-панель).

## Endpoints

| Role | Method | Route | Auth |
|------|--------|-------|------|
| Client | POST | `/api/auth/login` | Public |
| Admin | POST | `/api/admin/auth/login` | Public |

## Request

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Validation:** email та password обов'язкові.

## Response (200)

```json
{
  "success": true,
  "data": {
    "access_token": "jwt...",
    "refresh_token": "token...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "USER"
    }
  }
}
```

## Логіка

### Client (`src/client/auth/auth.controller.ts`)
1. Валідація email + password
2. Викликає `AuthService.login()`
3. Повертає токени + профіль

### Admin (`src/admin/auth/auth.controller.ts`)
1. Валідація email + password
2. Викликає `AuthService.login()`
3. **Додаткова перевірка:** якщо `role` не `ADMIN` або `SUPER_ADMIN` → повертає 403 Forbidden
4. Повертає токени + профіль

### Service (`src/shared/services/auth.service.ts`)
1. `supabaseAdmin.auth.signInWithPassword({ email, password })`
2. Отримує профіль з `profiles` таблиці (full_name, role)
3. Формує відповідь з access_token, refresh_token, user data

## Зв'язки

- **DB:** `auth.users` (Supabase Auth) + `profiles` таблиця (full_name, role)
- **Middleware:** не потрібен (публічний endpoint)
- **Використовується:** web login page, mobile login screen
