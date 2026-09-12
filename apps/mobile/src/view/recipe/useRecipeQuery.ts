import { useMemo } from 'react';

import type { RecipeListQuery, RecipeTab } from '@/data';
import { useStore } from '@/state';
import { RECIPE_KCAL_RANGE } from '@/state/domains/recipe';

/**
 * Turns the stored filter selections into the query the list endpoint takes.
 *
 * The calorie range is only sent when it has actually been narrowed: the
 * default spans everything, and passing it would exclude recipes the server
 * has no calorie figure for.
 */
export const useRecipeQuery = (tab: RecipeTab, search?: string): Omit<RecipeListQuery, 'page' | 'limit'> => {
    const filters = useStore(state => state.recipeFilters);

    return useMemo(() => {
        const [min, max] = filters.kcalRange;
        const [defaultMin, defaultMax] = RECIPE_KCAL_RANGE;

        return {
            tab,
            ...(search?.trim() ? { q: search.trim() } : {}),
            ...(filters.categories.length ? { categories: filters.categories } : {}),
            ...(filters.cuisines.length ? { cuisines: filters.cuisines } : {}),
            ...(filters.diets.length ? { diets: filters.diets } : {}),
            ...(filters.products.length ? { products: filters.products } : {}),
            ...(filters.productGroups.length ? { productGroups: filters.productGroups } : {}),
            ...(min > defaultMin ? { caloriesMin: min } : {}),
            ...(max < defaultMax ? { caloriesMax: max } : {}),
        };
    }, [filters, search, tab]);
};
