# 02 - Domains

Кожен домен охоплює три шари: **data** (API + types), **state** (React Query hooks + Zustand slices), **view** (screens/pages).

---

## V1 Domains

### Auth Domain
- Реєстрація / логін через Supabase Auth (email + password, можливо social)
- Session management, refresh tokens

**Data:** auth.api.ts, auth.types.ts
**State:** auth.slice.ts (isAuthenticated), hooks (useSignIn, useSignUp, useSignOut)
**View (mobile):** SignInScreen, SignUpScreen
**View (web):** Login page

---

### User Domain
- Профіль користувача (ім'я, аватар, мова)
- Персональні налаштування (ціль калорій, ціль БЖВ)
- Вибір мови (uk, en, es)

**Data:** user.api.ts, user.types.ts
**State:** user.slice.ts, hooks (useGetMe, useUpdateProfile)
**View (mobile):** ProfileScreen, SettingsScreen
**View (web):** Users management

---

### Recipe Domain
- CRUD рецептів (назва, опис, фото, інструкція, час приготування)
- Пошук та фільтрація по категоріях/тегах
- Динамічний перерахунок порцій (інгредієнти + калорії)
- Зв'язки: recipe ↔ ingredients (M2M), recipe ↔ category (M2O), recipe ↔ tags (M2M)
- Макронутрієнти на порцію (Білки, Жири, Вуглеводи, ккал)

**Data:** recipe.api.ts, recipe.types.ts
**State:** hooks (useGetRecipes, useGetRecipe, useCreateRecipe, useUpdateRecipe, useDeleteRecipe)
**View (mobile):** RecipesScreen (grid + search + category scroll), RecipeDetailScreen (фото, БЖВ, порції, інструкція)
**View (web):** Recipes list, Recipe create/edit form

---

### Ingredient Domain
- База інгредієнтів з нутриціологічними даними (калорії, Б/Ж/В на 100г)
- Пошук інгредієнтів
- Одиниці виміру (г, мл, шт, ст.л., ч.л.)

**Data:** ingredient.api.ts, ingredient.types.ts
**State:** hooks (useGetIngredients, useSearchIngredients, useCreateIngredient)
**View (mobile):** пошук інгредієнтів при додаванні в рецепт або ручному логуванні
**View (web):** Ingredients list, Ingredient create/edit

---

### Product Domain
- База продуктів з нутриціологічними даними (КБЖВ на 100г) та мультимовними назвами (20 мов)
- Два типи: global (272 prefilled з USDA, verified) та custom (user-created, одна мова)
- Пошук по назві з фільтрацією по мові юзера (inner join на product_translations)
- Формула калорій: Б×4 + В×4 + Ж×9
- Адмін може редагувати КБЖВ + переклади для всіх 20 мов, верифікувати custom продукти

**Data:** product.api.ts, product.types.ts (Product, ProductDetail, UpdateProductParams)
**State:** hooks (useGetProducts, useGetProduct, useUpdateProduct, useVerifyProduct)
**View (mobile):** пошук продуктів при додаванні в рецепт або ручному логуванні
**View (web):** ProductsPage (таблиця + пошук + фільтр по типу), ProductDetailPanel (view + edit mode у Sheet)
**DB:** products, product_translations
**Knowledge:** `.claude/knowledge/product/overview.md`

---

### Category Domain
- Категорії рецептів: Сніданок, Обід, Вечеря, Перекус, Напої, Десерти тощо
- Горизонтальний скрол на екрані рецептів
- CRUD в адмін-панелі

**Data:** category.api.ts, category.types.ts
**State:** hooks (useGetCategories, useCreateCategory)
**View (mobile):** горизонтальний фільтр на RecipesScreen
**View (web):** Categories management

---

### Tag Domain
- Дієтичні теги: vegetarian, keto, high-protein, gluten-free, dairy-free, breakfast, dessert тощо
- Множинна фільтрація на екрані рецептів
- CRUD в адмін-панелі

**Data:** tag.api.ts, tag.types.ts
**State:** hooks (useGetTags, useCreateTag)
**View (mobile):** chip-фільтри на RecipesScreen
**View (web):** Tags management

---

### Meal Plan Domain
- Денний план: 4 слоти (Сніданок, Обід, Вечеря, Перекус)
- Додавання рецептів у слоти
- Тижневий календар (горизонтальний скрол днів)
- Duplicate Day — копіювання меню на 3–7 днів для meal prep
- Готові професійні раціони (pre-made plans)
- Сумарна калорійність та БЖВ на день

**Data:** meal-plan.api.ts, meal-plan.types.ts
**State:** hooks (useGetMealPlan, useGetWeeklyPlan, useAddToMealPlan, useRemoveFromMealPlan, useDuplicateDay)
**View (mobile):** HomeScreen (сьогоднішній план + калорії), MealPlanScreen (конструктор), WeeklyCalendarScreen
**View (web):** Meal Plans management, pre-made plan editor

---

### Shopping List Domain
- Автоматична генерація з meal plan
- Розумне групування за категоріями супермаркету (Протеїни, Овочі, Молочні продукти тощо)
- Синхронізація з кількістю порцій (зміна порцій → оновлення грамовки)
- Чекбокси для відмітки купленого
- Об'єднання дублікатів (один інгредієнт з різних рецептів → сумарна кількість)

**Data:** shopping-list.api.ts, shopping-list.types.ts
**State:** hooks (useGetShoppingList, useGenerateShoppingList, useToggleItem)
**View (mobile):** ShoppingListScreen

---

## V2 Domains

### Tracking Domain
- Дашборд калорій: спожито / залишилось (кільцевий графік)
- Персоналізований щоденний ліміт
- Автоматичне підтягування з Meal Plan
- Ручне додавання: пошук інгредієнта → вага → авто-прорахунок БЖВ
- Розбивка по прийомах їжі (Сніданок, Обід, Вечеря)

**Data:** tracking.api.ts, tracking.types.ts
**State:** hooks (useGetDailyTracking, useLogFood, useGetCalorieSummary)
**View (mobile):** TrackingDashboardScreen, AddFoodScreen

---

### Progress Domain
- Графік зміни ваги по датах
- Візуальний щоденник прогресу (Before / After фото)
- Логування ваги

**Data:** progress.api.ts, progress.types.ts
**State:** hooks (useGetWeightHistory, useLogWeight, useGetProgressPhotos, useUploadProgressPhoto)
**View (mobile):** ProgressScreen (графік + фото)

---

## V3 Domains (Future)

### Scanner Domain
- AI-камера для розпізнавання інгредієнтів
- Миттєвий підрахунок калорій по фото
- Аналіз меню ресторану

---

## Domain Summary

| Domain | Version | Mobile Screens | Web Pages | DB Tables |
|--------|---------|---------------|-----------|-----------|
| auth | V1 | SignIn, SignUp | Login | profiles |
| user | V1 | Profile, Settings | Users | profiles |
| recipe | V1 | Recipes, RecipeDetail | Recipes CRUD | recipes, recipe_ingredients, recipe_translations |
| ingredient | V1 | (search widget) | Ingredients CRUD | ingredients, ingredient_translations |
| product | V1 | (search widget) | Products list + edit | products, product_translations |
| category | V1 | (filter on Recipes) | Categories CRUD | categories |
| tag | V1 | (chips on Recipes) | Tags CRUD | tags, tag_translations, recipe_tags |
| meal-plan | V1 | Home, MealPlan, WeeklyCalendar | MealPlans CRUD | meal_plans, meal_plan_items |
| shopping-list | V1 | ShoppingList | — | shopping_lists, shopping_list_items |
| language | V1 | — | — | languages (20 rows) |
| tracking | V2 | TrackingDashboard, AddFood | — | daily_tracking, food_logs |
| progress | V2 | Progress | — | weight_logs, progress_photos |
| scanner | V3 | ScannerCamera | — | — |
