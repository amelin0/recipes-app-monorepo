import { useCallback } from 'react';

import { router } from 'expo-router';

import { useStore } from '@/state';
import { useGetRecipeFilters, useGetRecipes } from '@/state/domains/catalog';
import { countRecipeFilters, type RecipeFilterGroup } from '@/state/domains/recipe';

import { useRecipeQuery } from '../useRecipeQuery';

export const useRecipesFilterScreen = () => {
    const filters = useStore(state => state.recipeFilters);
    const toggleRecipeFilter = useStore(state => state.toggleRecipeFilter);
    const setRecipeKcalRange = useStore(state => state.setRecipeKcalRange);
    const resetRecipeFilters = useStore(state => state.resetRecipeFilters);

    const { data: options, isLoading, isError, refetch } = useGetRecipeFilters();

    // «Показати N результатів» — це той самий запит, що й у списку, лише за
    // лічильником. Сторінка перша й найменша: із відповіді потрібне саме
    // `meta.total`, а не самі рецепти.
    const query = useRecipeQuery('all');
    const { data: preview, isFetching } = useGetRecipes(query);

    const handleClose = useCallback(() => {
        if (router.canGoBack()) router.back();
    }, []);

    return {
        filters,
        options,
        isLoading,
        isError,
        handleRetry: refetch,
        filtersCount: countRecipeFilters(filters),
        resultsCount: preview?.pages[0]?.meta.total ?? 0,
        isCounting: isFetching,
        handleToggle: (group: RecipeFilterGroup, value: string) => toggleRecipeFilter(group, value),
        handleKcalChange: (low: number, high: number) => setRecipeKcalRange([low, high]),
        handleReset: resetRecipeFilters,
        handleShow: handleClose,
        handleAllIngredients: () => router.push('/(app)/filter-ingredients'),
    };
};
