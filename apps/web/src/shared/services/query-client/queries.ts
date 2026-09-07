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
  RECIPE_FULL = 'recipe-full',
  TAGS = 'tags',
  TAGS_FULL = 'tags-full',
  PRODUCTS_SEARCH = 'products-search',
  LANGUAGES = 'languages',

  // ─── Products ────────────────────────────────────────
  PRODUCTS = 'products',
  PRODUCT = 'product',

  // ─── Shopping List ────────────────────────────────────
  SHOPPING_LIST = 'shopping-list',

  // ─── Dashboard ───────────────────────────────────────
  REGISTRATION_STATS = 'registration-stats',
  TOP_FAVORITED = 'top-favorited',
  FAVORITE_STATS = 'favorite-stats',

  // ─── Support ─────────────────────────────────────────
  SUPPORT_MESSAGES = 'support-messages',
  SUPPORT_MESSAGE = 'support-message',

  // ─── Notifications ──────────────────────────────────
  NOTIFICATIONS = 'notifications',
  UNREAD_COUNT = 'unread-count',

  // ─── Meal Plan ────────────────────────────────────────
  MEAL_PLAN_WEEK = 'meal-plan-week',
  MEAL_PLAN_TODAY = 'meal-plan-today',
  MEAL_PLAN_DAY = 'meal-plan-day',
}
