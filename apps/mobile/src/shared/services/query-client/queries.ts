// Centralized query keys for React Query.
//
// `Queries` — flat enum of stable string prefixes (one per query family).
// Per-domain factories below build composite keys (id, term, …) and are
// the only sanctioned way to construct keys at call sites — never inline.
//
// List keys deliberately exclude `page`/`limit` — `useInfiniteQuery` owns
// paging, so all pages of one filtered list share a single cache entry.

export enum Queries {
    Me = 'me',
    Profile = 'profile',
    Onboarding = 'onboarding',
    Recommendations = 'recommendations',
    Reminders = 'reminders',
    Faq = 'faq',
    Subscription = 'subscription',
    SubscriptionPlans = 'subscription-plans',
    Referral = 'referral',
    Recipes = 'recipes',
    Recipe = 'recipe',
    Products = 'products',
    Product = 'product',
    RecipeFilters = 'recipe-filters',
    NutritionDay = 'nutrition-day',
    NutritionGoal = 'nutrition-goal',
    Notifications = 'notifications',
    NotificationsUnread = 'notifications-unread',
    ProgressMetrics = 'progress-metrics',
    ProgressMetric = 'progress-metric',
    MealPlan = 'meal-plan',
    ShoppingList = 'shopping-list',
}

// TODO: replace with `Omit<ListRecipesQuery, 'page' | 'limit'>` from
// @dns/validation once the workspace package exists.
export type RecipesListFilters = Record<string, unknown>;
export type ProductsListFilters = Record<string, unknown>;

/**
 * Auth-domain query-key factory. The account's own state — read before the
 * app decides which screen to open.
 */
export const authKeys = {
    /** Account state — `GET /auth/me`: verification and pending deletion. */
    me: () => [Queries.Me] as const,
};

/**
 * User-domain query-key factory. Used by hooks in
 * `state/domains/user/hooks/` and by any consumer that needs to invalidate
 * or read user-domain caches.
 */
export const userKeys = {
    /** Own profile — `GET /profile`. Also carries settings, so every settings
        screen reads and writes through this one entry. */
    profile: () => [Queries.Profile] as const,

    /** Reminder schedule — `GET /profile/reminders`. */
    reminders: () => [Queries.Reminders] as const,

    /** Questionnaire answers and progress — `GET /profile/onboarding`. */
    onboarding: () => [Queries.Onboarding] as const,

    /** Computed daily norms — `GET /profile/recommendations`. */
    recommendations: () => [Queries.Recommendations] as const,
};

/** FAQ-domain query-key factory. */
export const faqKeys = {
    /** Whole topic tree — `GET /faq`. */
    topics: () => [Queries.Faq] as const,
};

/** Subscription-domain query-key factory. */
export const subscriptionKeys = {
    /** Current subscription + paywall flag — `GET /subscription`. */
    state: () => [Queries.Subscription] as const,

    /** Paywall offer — `GET /subscription/plans`. */
    plans: () => [Queries.SubscriptionPlans] as const,

    /** Own referral code and its tally — `GET /profile/referral`. */
    referral: () => [Queries.Referral] as const,
};

/** Recipe-domain query-key factory. */
export const recipeKeys = {
    /** Paginated recipes list — `GET /recipes`. */
    recipes: (filters?: RecipesListFilters) => [Queries.Recipes, filters ?? {}] as const,

    /** Single recipe detail — `GET /recipes/:id`. */
    recipe: (id: string) => [Queries.Recipe, id] as const,

    /** Everything the filter sheet offers — `GET /recipes/filters`. */
    filters: () => [Queries.RecipeFilters] as const,
};

/** Notification-domain query-key factory. */
export const notificationKeys = {
    /** Paginated list — `GET /notifications`. */
    list: (unreadOnly: boolean) => [Queries.Notifications, unreadOnly] as const,

    /** Badge count — `GET /notifications/unread-count`. */
    unreadCount: () => [Queries.NotificationsUnread] as const,
};

/** Progress-domain query-key factory. */
export const progressKeys = {
    /** Every card for a period — `GET /progress/metrics?days=`. */
    metrics: (days: number) => [Queries.ProgressMetrics, days] as const,

    /** One metric's detail — `GET /progress/metrics/:metric?days=`. */
    metric: (metric: string, days: number) => [Queries.ProgressMetric, metric, days] as const,
};

/** Nutrition-domain query-key factory. */
export const nutritionKeys = {
    /** One day's tracking payload — `GET /nutrition/days/:date`. */
    day: (date: string) => [Queries.NutritionDay, date] as const,

    /** The daily targets — `GET /nutrition/goal`. */
    goal: () => [Queries.NutritionGoal] as const,
};

/** Product-domain query-key factory. */
export const productKeys = {
    /** Paginated products list — `GET /products`. */
    products: (filters?: ProductsListFilters) => [Queries.Products, filters ?? {}] as const,

    /** Single product detail — `GET /products/:id`. */
    product: (id: string) => [Queries.Product, id] as const,
};

/** Meal-plan-domain query-key factory. */
export const mealPlanKeys = {
    /**
     * A closed range of days — `GET /meal-plan?from=&to=`.
     *
     * Keyed by the range, not by one date: the plan tab reads a fortnight at
     * a time and the home screen a single day, and they must not share an
     * entry that holds only part of what the other needs.
     */
    plan: (from: string, to: string) => [Queries.MealPlan, from, to] as const,
};

/** Shopping-list-domain query-key factory. */
export const shoppingListKeys = {
    /** The list summed over a range of days — `GET /shopping-list?from=&to=`. */
    list: (from: string, to: string) => [Queries.ShoppingList, from, to] as const,
};
