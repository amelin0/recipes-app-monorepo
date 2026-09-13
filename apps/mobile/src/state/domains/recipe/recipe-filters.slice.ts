import type { StateCreator } from 'zustand';

/**
 * Filter groups, named as the API names them.
 *
 * `products` are individual products («шпинат»), `productGroups` whole aisles
 * («Овочі») — the filter sheet shows both, and calling either «інгредієнти»
 * made the two indistinguishable at the call site.
 */
export type RecipeFilterGroup = 'products' | 'productGroups' | 'categories' | 'cuisines' | 'diets';

/** Server ids, not labels: the labels come with the filter payload. */
export interface RecipeFiltersState {
    products: string[];
    productGroups: string[];
    categories: string[];
    cuisines: string[];
    diets: string[];
    /** Kcal per serving; the top of the range means «and above». */
    kcalRange: [number, number];
}

export const RECIPE_KCAL_RANGE: [number, number] = [0, 800];
export const RECIPE_KCAL_STEP = 10;

const INITIAL_FILTERS: RecipeFiltersState = {
    products: [],
    productGroups: [],
    categories: [],
    cuisines: [],
    diets: [],
    kcalRange: RECIPE_KCAL_RANGE,
};

export const RECIPE_FILTER_GROUPS: RecipeFilterGroup[] = [
    'products',
    'productGroups',
    'categories',
    'cuisines',
    'diets',
];

export interface RecipeFiltersSlice {
    recipeFilters: RecipeFiltersState;
    toggleRecipeFilter: (group: RecipeFilterGroup, value: string) => void;
    /** Replaces a whole group at once — the ingredient catalog commits its draft this way. */
    setRecipeFilterGroup: (group: RecipeFilterGroup, values: string[]) => void;
    setRecipeKcalRange: (range: [number, number]) => void;
    resetRecipeFilters: () => void;
}

/** Number of active filter selections (kcal range not counted). */
/**
 * Скільки фільтрів зараз стоїть.
 *
 * Звужений діапазон калорій рахується нарівні зі списками: він так само
 * ховає рецепти, і «Скинути всі фільтри (0)» при активному діапазоні —
 * неправда, тим більше що скидання його таки скидає.
 */
export const countRecipeFilters = (filters: RecipeFiltersState): number => {
    const [min, max] = filters.kcalRange;
    const [defaultMin, defaultMax] = RECIPE_KCAL_RANGE;
    const narrowed = min > defaultMin || max < defaultMax ? 1 : 0;

    return RECIPE_FILTER_GROUPS.reduce((total, group) => total + filters[group].length, narrowed);
};

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
