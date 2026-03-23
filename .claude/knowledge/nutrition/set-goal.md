# Nutrition — Set Goal

## Overview

Встановлення денної цілі по макронутрієнтах (БЖВ) та калоріях. Один активний goal на юзера (upsert).

## Endpoint

| Method | Route | Auth |
|--------|-------|------|
| POST | `/api/nutrition/goal` | Bearer token |

## Request

Варіант 1 — тільки БЖВ (калорії авторахуються):
```json
{
  "daily_proteins_g": 165,
  "daily_carbs_g": 140,
  "daily_fats_g": 155
}
```
Формула: `proteins * 4 + carbs * 4 + fats * 9 = kcal`

Варіант 2 — калорії задані вручну:
```json
{
  "daily_calories": 2000,
  "daily_proteins_g": 165,
  "daily_carbs_g": 140,
  "daily_fats_g": 155
}
```

## Логіка

### Service (`shared/services/nutrition.service.ts`)
1. Якщо `daily_calories` не передано — рахує автоматично з БЖВ, `is_auto_calculated = true`
2. Якщо передано — використовує як є, `is_auto_calculated = false`
3. Upsert в `nutrition_goals` по `user_id` (завжди один рядок на юзера)

### DB: `nutrition_goals`

| Column | Type | Note |
|--------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → auth.users, UNIQUE |
| daily_calories | INT | auto або manual |
| daily_proteins_g | INT | |
| daily_carbs_g | INT | |
| daily_fats_g | INT | |
| is_auto_calculated | BOOL | true якщо kcal вирахувані з БЖВ |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | auto-update trigger |
