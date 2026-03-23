# Nutrition — Get Daily Stats

## Overview

Повертає ціль (goal) + поточне споживання (current) за конкретну дату. Те що відображається на головному екрані — кільцевий графік калорій та БЖВ.

## Endpoint

| Method | Route | Auth |
|--------|-------|------|
| GET | `/api/nutrition/daily?date=2026-03-23` | Bearer token |

`date` — опціональний, формат `YYYY-MM-DD`. Default: сьогодні.

## Response (200)

```json
{
  "success": true,
  "data": {
    "date": "2026-03-23",
    "goal": {
      "daily_calories": 1650,
      "daily_proteins_g": 165,
      "daily_carbs_g": 140,
      "daily_fats_g": 155
    },
    "current": {
      "total_calories": 670,
      "total_proteins_g": 45,
      "total_carbs_g": 78,
      "total_fats_g": 15
    }
  }
}
```

`goal: null` якщо юзер ще не встановив ціль.

## Логіка

### Service (`shared/services/nutrition.service.ts`)
1. Паралельно запитує `nutrition_goals` (ціль) та `daily_nutrition_summary` (спожито за дату)
2. Якщо summary на цю дату немає — повертає нулі
3. Формує об'єкт з goal + current

### DB: `daily_nutrition_summary`

| Column | Type | Note |
|--------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → auth.users |
| date | DATE | UNIQUE з user_id |
| total_calories | INT | default 0 |
| total_proteins_g | INT | default 0 |
| total_carbs_g | INT | default 0 |
| total_fats_g | INT | default 0 |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | auto-update trigger |

**Примітка:** `daily_nutrition_summary` заповнюється/оновлюється доменом `food-log` при додаванні/зміні записів їжі. Поки food-log не реалізований — current завжди нулі.
