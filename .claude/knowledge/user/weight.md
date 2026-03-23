# User — Weight

## Overview

Оновлення ваги користувача. Поточна вага зберігається в `profiles.weight_kg`, а кожне оновлення записується в `weight_history` для побудови графіку прогресу.

## Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/users/weight` | Bearer token | Оновити вагу |
| GET | `/api/users/weight/history` | Bearer token | Історія змін ваги |

## POST /users/weight

### Request
```json
{ "weight_kg": 64.5 }
```

**Validation:** `weight_kg` — обов'язкове, число > 0.

### Response (200)
Повертає оновлений повний профіль (з `weight_kg`).

### Логіка
1. Оновлює `profiles.weight_kg` — завжди актуальна вага
2. Upsert в `weight_history` (один запис на юзера на день)
3. Якщо юзер оновлює вагу кілька разів за день — перезаписує

## GET /users/weight/history

### Response (200)
```json
{
  "success": true,
  "data": [
    { "weight_kg": 70.0, "recorded_at": "2026-03-01" },
    { "weight_kg": 68.5, "recorded_at": "2026-03-15" },
    { "weight_kg": 64.0, "recorded_at": "2026-03-23" }
  ]
}
```

Відсортовано по `recorded_at` ascending (для побудови графіку).

## DB

### profiles (оновлення)
| Column | Type | Note |
|--------|------|------|
| weight_kg | NUMERIC(5,2) | nullable, поточна вага |

### weight_history
| Column | Type | Note |
|--------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → auth.users |
| weight_kg | NUMERIC(5,2) | NOT NULL |
| recorded_at | DATE | default today, UNIQUE з user_id |
| created_at | TIMESTAMPTZ | |

## Зв'язки

- `GET /users/me` повертає `weight_kg` в профілі
- Графік прогресу (V2) будується з `weight_history`
- Одиниці відображення залежать від `metric_system` (METRIC → kg, IMPERIAL → lbs)
