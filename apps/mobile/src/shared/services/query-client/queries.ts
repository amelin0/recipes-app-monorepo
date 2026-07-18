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
    Recipes = 'recipes',
    Recipe = 'recipe',
    RecipeCategories = 'recipe-categories',
    Products = 'products',
    Product = 'product',
    MealPlan = 'meal-plan',
    ShoppingList = 'shopping-list',
}

// TODO: replace with `Omit<ListRecipesQuery, 'page' | 'limit'>` from
// @dns/validation once the workspace package exists.
export type RecipesListFilters = Record<string, unknown>;
export type ProductsListFilters = Record<string, unknown>;

/**
 * User-domain query-key factory. Used by hooks in
 * `state/domains/user/hooks/` and by any consumer that needs to invalidate
 * or read user-domain caches.
 */
export const userKeys = {
    /** Own profile — `GET /users/me`. */
    me: () => [Queries.Me] as const,
};

/** Recipe-domain query-key factory. */
export const recipeKeys = {
    /** Paginated recipes list — `GET /recipes`. */
    recipes: (filters?: RecipesListFilters) => [Queries.Recipes, filters ?? {}] as const,

    /** Single recipe detail — `GET /recipes/:id`. */
    recipe: (id: string) => [Queries.Recipe, id] as const,

    /** Recipe categories — `GET /recipes/categories`. */
    categories: () => [Queries.RecipeCategories] as const,
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
    /** Meal plan for a day/period — `GET /meal-plan`. */
    plan: (date?: string) => [Queries.MealPlan, date ?? ''] as const,
};

/** Shopping-list-domain query-key factory. */
export const shoppingListKeys = {
    /** The user's shopping list — `GET /shopping-list`. */
    list: () => [Queries.ShoppingList] as const,
};
