# User — Settings

## Overview

Налаштування користувача: мова інтерфейсу та система вимірювань. Зберігаються в `profiles` таблиці та повертаються разом з GET /users/me.

## Endpoints

| Role | Method | Route | Auth | Description |
|------|--------|-------|------|-------------|
| Client | POST | `/api/users/language` | Bearer token | Змінити мову |
| Client | POST | `/api/users/metric-system` | Bearer token | Змінити систему вимірювань |

## Language

ISO 639-1 коди. Enum `app_language`: `uk`, `en`, `ru`, `es`. Default: `uk`.

### Request
```json
{ "language": "en" }
```

### Validation
Дозволені значення: `uk`, `en`, `ru`, `es`.

## Metric System

Enum `metric_system`: `METRIC`, `IMPERIAL`. Default: `METRIC`.

| Value | Інгредієнти | Вага тіла | Зріст |
|-------|------------|-----------|-------|
| `METRIC` | g / kg | kg | cm |
| `IMPERIAL` | oz / lbs | lbs | ft, in |

### Request
```json
{ "metric_system": "IMPERIAL" }
```

### Validation
Дозволені значення: `METRIC`, `IMPERIAL`.

## Response (200)

Обидва endpoints повертають оновлений повний профіль:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "user@example.com",
    "role": "USER",
    "language": "en",
    "metric_system": "METRIC",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

## Логіка

### Controller (`src/client/users/user.controller.ts`)
1. Валідація вхідного значення проти дозволених enum values
2. Викликає `UserService.updateLanguage()` або `UserService.updateMetricSystem()`
3. Повертає оновлений профіль

### Service (`src/shared/services/user.service.ts`)
1. `supabaseAdmin.from('profiles').update({ language }).eq('id', userId).select().single()`
2. Trigger `on_profiles_updated` автоматично оновлює `updated_at`

## Зв'язки

- **DB:** `profiles` таблиця — колонки `language` та `metric_system`
- **Middleware:** `authMiddleware` (обов'язковий)
- **GET /users/me:** автоматично включає language та metric_system (select *)
- **Frontend:** i18next використовує `language` для локалізації, компоненти використовують `metric_system` для відображення одиниць
