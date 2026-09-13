/** Whether the row came from our catalogue or the user made it. */
export type ContentSource = 'global' | 'custom';

/** The three cuts of the same collection the recipes tab offers. */
export type RecipeTab = 'all' | 'favorite' | 'own';

/** A named, pickable thing: a category, cuisine, diet or product group. */
export interface Reference {
    id: string;
    slug: string;
    emoji: string | null;
    imageUrl: string | null;
    name: string;
}

export interface Nutrition {
    calories: number;
    proteinG: number;
    fatsG: number;
    carbsG: number;
    /** Null when the recipe does not say what a serving weighs. */
    weightG: number | null;
}

export interface Product {
    id: string;
    name: string;
    source: ContentSource;
    group: Reference | null;
    caloriesPer100g: number;
    proteinPer100g: number;
    fatsPer100g: number;
    carbsPer100g: number;
    /** «1 шт», «1 склянка» — null when the product is only weighed. */
    servingLabel: string | null;
    servingWeightG: number | null;
    servingCalories: number | null;
    isVerified: boolean;
}

export interface RecipeCard {
    id: string;
    title: string;
    source: ContentSource;
    photoUrl: string | null;
    cookTimeMinutes: number | null;
    servings: number;
    perServing: Nutrition;
    isFavorite: boolean;
}

export interface RecipeIngredient {
    id: string;
    productId: string;
    name: string;
    amountG: number;
    calories: number;
    proteinG: number;
    fatsG: number;
    carbsG: number;
}

export interface RecipeStep {
    id: string;
    stepNumber: number;
    title: string;
    description: string | null;
    durationMinutes: number | null;
    /** Which ingredients this step uses — the design highlights them. */
    ingredientIds: string[];
}

export interface RecipeDetail extends RecipeCard {
    /** The whole dish, not one serving. */
    total: Nutrition;
    category: Reference | null;
    cuisine: Reference | null;
    diets: Reference[];
    ingredients: RecipeIngredient[];
    steps: RecipeStep[];
}

/** Everything the filter sheet needs, in one read. */
export interface RecipeFilters {
    /** The handful of products the sheet offers before «Всі інгредієнти». */
    quickProducts: Product[];
    categories: Reference[];
    productGroups: Reference[];
    cuisines: Reference[];
    diets: Reference[];
    calories: { min: number; max: number };
}

export interface RecipeListQuery {
    tab?: RecipeTab;
    q?: string;
    categories?: string[];
    cuisines?: string[];
    diets?: string[];
    products?: string[];
    productGroups?: string[];
    caloriesMin?: number;
    caloriesMax?: number;
    page?: number;
    limit?: number;
}

export interface ProductListQuery {
    q?: string;
    groupId?: string;
    page?: number;
    limit?: number;
}

/** Page metadata the list endpoints carry beside `data`. */
export interface PageMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface Paginated<T> {
    data: T[];
    meta: PageMeta;
}

export interface CreateProductPayload {
    name: string;
    groupId?: string | null;
    caloriesPer100g: number;
    proteinPer100g: number;
    fatsPer100g: number;
    carbsPer100g: number;
    servingLabel?: string | null;
    servingWeightG?: number | null;
}

export interface CreateRecipeIngredientPayload {
    productId: string;
    amountG: number;
}

export interface CreateRecipeStepPayload {
    title?: string | null;
    description?: string | null;
    durationMinutes?: number | null;
    /** Indexes into `ingredients`, not ids — the ingredients do not exist yet. */
    ingredientIndexes?: number[];
}

/**
 * Creating a dish.
 *
 * No `cookTimeMinutes`, `servings`, category or diets: the endpoint does not
 * accept them, so the create-dish screen cannot set what its own card then
 * displays (`handoff/mobile-ui-review.md` §4.7). Nor is there a route to edit
 * a dish afterwards.
 */
export interface CreateRecipePayload {
    title: string;
    cuisineId?: string | null;
    photoUrl?: string | null;
    ingredients: CreateRecipeIngredientPayload[];
    steps?: CreateRecipeStepPayload[];
}
