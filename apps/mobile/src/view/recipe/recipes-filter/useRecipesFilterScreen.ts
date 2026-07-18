import { useCallback } from 'react';

import { router } from 'expo-router';

import { useStore } from '@/state';
import { countRecipeFilters, type RecipeFilterGroup } from '@/state/domains/recipe';

// TODO: query the API for the matching recipe count once it ships.
const MOCK_RESULTS_COUNT = 129;

export const useRecipesFilterScreen = () => {
    const filters = useStore(state => state.recipeFilters);
    const toggleRecipeFilter = useStore(state => state.toggleRecipeFilter);
    const setRecipeKcalRange = useStore(state => state.setRecipeKcalRange);
    const resetRecipeFilters = useStore(state => state.resetRecipeFilters);

    const handleClose = useCallback(() => {
        if (router.canGoBack()) router.back();
    }, []);

    return {
        filters,
        filtersCount: countRecipeFilters(filters),
        resultsCount: MOCK_RESULTS_COUNT,
        handleToggle: (group: RecipeFilterGroup, value: string) => toggleRecipeFilter(group, value),
        handleKcalChange: (low: number, high: number) => setRecipeKcalRange([low, high]),
        handleReset: resetRecipeFilters,
        handleClose,
        handleShow: handleClose,
    };
};
