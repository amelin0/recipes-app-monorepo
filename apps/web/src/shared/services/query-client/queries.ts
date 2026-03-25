export enum Queries {
  // ─── Auth ─────────────────────────────────────────────
  // (no queries yet, auth uses mutations)

  // ─── User ─────────────────────────────────────────────
  USER_ME = 'user-me',
  WEIGHT_HISTORY = 'weight-history',
  ADMIN_USERS = 'admin-users',
  ADMIN_USER = 'admin-user',

  // ─── Nutrition ────────────────────────────────────────
  NUTRITION_GOAL = 'nutrition-goal',
  NUTRITION_DAILY = 'nutrition-daily',

  // ─── Recipes ──────────────────────────────────────────
  RECIPES = 'recipes',
  RECIPE = 'recipe',
  TAGS = 'tags',
  INGREDIENTS = 'ingredients',

  // ─── Shopping List ────────────────────────────────────
  SHOPPING_LIST = 'shopping-list',

  // ─── Dashboard ───────────────────────────────────────
  REGISTRATION_STATS = 'registration-stats',

  // ─── Meal Plan ────────────────────────────────────────
  MEAL_PLAN_WEEK = 'meal-plan-week',
  MEAL_PLAN_TODAY = 'meal-plan-today',
  MEAL_PLAN_DAY = 'meal-plan-day',
}
