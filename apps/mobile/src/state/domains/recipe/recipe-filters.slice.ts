import type { StateCreator } from 'zustand';

export type RecipeFilterGroup = 'ingredients' | 'categories' | 'products' | 'cuisines' | 'diets';

export interface RecipeFiltersState {
    /** Named ingredients from «Пошук за інгредієнтами» (594:43425). */
    ingredients: string[];
    categories: string[];
    products: string[];
    cuisines: string[];
    diets: string[];
    /** Kcal per portion range; max 800 means "800+". */
    kcalRange: [number, number];
}

export const RECIPE_KCAL_RANGE: [number, number] = [0, 800];
export const RECIPE_KCAL_STEP = 10;

const INITIAL_FILTERS: RecipeFiltersState = {
    ingredients: [],
    categories: [],
    products: [],
    cuisines: [],
    diets: [],
    kcalRange: RECIPE_KCAL_RANGE,
};

export interface RecipeFiltersSlice {
    recipeFilters: RecipeFiltersState;
    toggleRecipeFilter: (group: RecipeFilterGroup, value: string) => void;
    /** Replaces a whole group at once — the ingredient catalog commits its draft this way. */
    setRecipeFilterGroup: (group: RecipeFilterGroup, values: string[]) => void;
    setRecipeKcalRange: (range: [number, number]) => void;
    resetRecipeFilters: () => void;
}

/** Number of active filter selections (kcal range not counted). */
export const countRecipeFilters = (filters: RecipeFiltersState): number =>
    filters.ingredients.length +
    filters.categories.length +
    filters.products.length +
    filters.cuisines.length +
    filters.diets.length;

export const createRecipeFiltersSlice: StateCreator<RecipeFiltersSlice, [], [], RecipeFiltersSlice> = set => ({
    recipeFilters: INITIAL_FILTERS,

    toggleRecipeFilter: (group, value) =>
        set(state => {
            const current = state.recipeFilters[group];
            const next = current.includes(value) ? current.filter(item => item !== value) : [...current, value];
            return { recipeFilters: { ...state.recipeFilters, [group]: next } };
        }),

    setRecipeFilterGroup: (group, values) =>
        set(state => ({ recipeFilters: { ...state.recipeFilters, [group]: values } })),

    setRecipeKcalRange: kcalRange => set(state => ({ recipeFilters: { ...state.recipeFilters, kcalRange } })),

    resetRecipeFilters: () => set(() => ({ recipeFilters: INITIAL_FILTERS })),
});
