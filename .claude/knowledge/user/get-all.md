# User — Get All (Admin)

## Overview

Отримання списку всіх користувачів. Доступно тільки для адмінів (ADMIN, SUPER_ADMIN).

## Endpoints

| Role | Method | Route | Auth |
|------|--------|-------|------|
| Admin | GET | `/api/admin/users/all` | Bearer token + ADMIN role |

## Request

Headers: `Authorization: Bearer <access_token>`

## Response (200)

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "email": "user@example.com",
      "role": "USER",
      "created_at": "2026-03-23T14:01:05.384405+00:00",
      "updated_at": "2026-03-23T14:01:05.384405+00:00"
    }
  ]
}
```

## Error Responses

- **401** — відсутній або невалідний token
- **403** — користувач не має ролі ADMIN або SUPER_ADMIN

## Логіка

### Controller (`src/admin/users/user.controller.ts`)
1. Викликає `UserService.getAll()`
2. Повертає масив профілів

### Service (`src/shared/services/user.service.ts`)
1. `supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false })`
2. Повертає всі профілі, відсортовані по даті створення (новіші перші)

### Middleware chain (застосовується на рівні `src/admin/router.ts`)
1. **authMiddleware** — верифікація JWT, встановлення userId
2. **adminMiddleware** — перевірка role в profiles таблиці:
   - Якщо role не ADMIN і не SUPER_ADMIN → 403 Forbidden
   - Встановлює `role` в context

## Зв'язки

- **DB:** `profiles` таблиця (service_role key — обходить RLS)
- **Middleware:** `authMiddleware` + `adminMiddleware`
- **Використовується:** admin panel — сторінка Users management
