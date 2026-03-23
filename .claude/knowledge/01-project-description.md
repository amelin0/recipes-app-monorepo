# 01 - Project Description

## What is Digital Nutrition Studio?

Цифрова студія нутриціології — екосистемний мобільний застосунок для здорового харчування, планування раціону та трекінгу калорій. Один мінімалістичний додаток замість розрізнених інструментів (пошук рецептів, калькулятор калорій, списки покупок).

## Target Audience

- Люди, які хочуть здорово харчуватися
- Ті, хто планує раціон та meal prep
- Користувачі, які відстежують калорії та макронутрієнти (БЖВ)

## Version Roadmap

### V1 — Recipe Planning Core (MVP)
- База 1000+ рецептів з пошуком та фільтрацією
- Горизонтальний скрол категорій та дієтичні теги
- Картка рецепту: фото, макронутрієнти (Б/Ж/В), інструкція, динамічний перерахунок порцій
- Конструктор денного раціону (Сніданок, Обід, Вечеря, Перекус)
- Тижневий календар харчування з функцією Duplicate Day
- Готові професійні раціони в один клік
- Автоматичний список покупок з розумним групуванням за категоріями супермаркету
- Синхронізація кількості порцій → грамовка в списку покупок
- Кнопки "Add to Meal Plan" та "Add to Shopping List" на сторінці рецепту

### V2 — Calorie Tracking & Progress
- Дашборд калорій: спожито / залишилось (візуалізація кільцевим графіком)
- Персоналізований щоденний ліміт калорій
- Автоматичне підтягування калорійності зі страв у Meal Plan
- Ручне додавання продуктів: пошук інгредієнта → введення ваги (грами) → автоматичний прорахунок
- Трекер ваги: графік зміни ваги по датах
- Візуальний щоденник прогресу (Before / After фото)

### V3 — Smart Food Analysis (Future)
- AI-камера для розпізнавання інгредієнтів та миттєвого підрахунку калорій
- Аналіз меню та готових страв у ресторанах

## Design Principles

- **Естетика:** Світлий, чистий wellness-мінімалізм. Жодних важких градієнтів чи темних тем
- **Масштабованість:** Архітектура карток розрахована на 1,000–3,000+ рецептів без перевантаження
- **Навігація:** Швидкий mobile-first досвід
- **Фото:** Акцент на якісних фотографіях страв
- **Локалізація:** Інтерфейс спроєктовано для легкої локалізації. Мови: Українська, English, Español

## Typography

- **Manrope** — headings (Medium, SemiBold, Bold)
- **Inter** — body text (Regular, SemiBold)

## Color Palette

- **Olive** (primary): #4A5A2B – #F5F5F0
- **Peach** (accent): #8A5530 – #FFF5F0
- **Neutral:** чорний текст, сірий #666666 для secondary text

## Navigation (Mobile)

Bottom tabs:
1. **Головна** (Home) — щоденний план з калорійністю
2. **План харчування** (Meal Plan) — конструктор раціону + календар
3. **Трекінг** (Tracking) — калорійний дашборд (V2)
4. **Рецепти** (Recipes) — база рецептів з пошуком
5. **Профіль** (Profile) — налаштування, мова, ціль калорій

## Platforms

- **Mobile:** Expo React Native (iOS + Android)
- **Web:** Next.js admin panel (управління рецептами, інгредієнтами, категоріями)
- **Backend:** Custom API via Supabase Edge Functions + Hono router (PostgreSQL, Auth, Storage)

## Architecture

**API-first:** Mobile та Web не використовують Supabase SDK напряму. Усі запити йдуть через наш custom HTTP API (Edge Functions + Hono). API має domain-driven структуру: routes → controller → service → Supabase admin client.

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Expo SDK 55 + React Native 0.83 | Cross-platform mobile |
| Next.js 16 + Tailwind CSS v4 | Admin panel |
| Supabase Edge Functions + Hono | Custom HTTP API |
| Supabase | DB (PostgreSQL), Auth, Storage |
| Unistyles 3 | Mobile styling |
| TypeScript | Type safety across all apps |
| React Query | Server state (mobile + web) |
| Zustand | Client state (mobile + web) |
| i18next | Internationalization (uk, en, es) |
