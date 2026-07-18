import type { StateCreator } from 'zustand';

export type RecipeFilterGroup = 'categories' | 'meals' | 'methods' | 'diets' | 'ingredients';

export interface RecipeFiltersState {
    categories: string[];
    meals: string[];
    methods: string[];
    diets: string[];
    ingredients: string[];
    /** Kcal per portion range; max 800 means "800+". */
    kcalRange: [number, number];
}

export const RECIPE_KCAL_RANGE: [number, number] = [0, 800];

const INITIAL_FILTERS: RecipeFiltersState = {
    categories: [],
    meals: [],
    methods: [],
    diets: [],
    ingredients: [],
    kcalRange: RECIPE_KCAL_RANGE,
};

export interface RecipeFiltersSlice {
    recipeFilters: RecipeFiltersState;
    toggleRecipeFilter: (group: RecipeFilterGroup, value: string) => void;
    setRecipeKcalRange: (range: [number, number]) => void;
    resetRecipeFilters: () => void;
}

/** Number of active filter selections (kcal range not counted). */
export const countRecipeFilters = (filters: RecipeFiltersState): number =>
    filters.categories.length +
    filters.meals.length +
    filters.methods.length +
    filters.diets.length +
    filters.ingredients.length;

export const createRecipeFiltersSlice: StateCreator<RecipeFiltersSlice, [], [], RecipeFiltersSlice> = set => ({
    recipeFilters: INITIAL_FILTERS,

    toggleRecipeFilter: (group, value) =>
        set(state => {
            const current = state.recipeFilters[group];
            const next = current.includes(value) ? current.filter(item => item !== value) : [...current, value];
            return { recipeFilters: { ...state.recipeFilters, [group]: next } };
        }),

    setRecipeKcalRange: kcalRange => set(state => ({ recipeFilters: { ...state.recipeFilters, kcalRange } })),

    resetRecipeFilters: () => set(() => ({ recipeFilters: INITIAL_FILTERS })),
});
