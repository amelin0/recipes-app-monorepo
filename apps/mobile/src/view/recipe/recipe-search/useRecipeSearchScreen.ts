import { useCallback, useMemo, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';

import {
    MOCK_CATEGORY_DISHES,
    MOCK_SEARCH_DISHES,
    MOCK_SEARCH_INGREDIENTS,
    RECIPE_RAIL_CATEGORIES,
} from '../recipe.constants';

export const useRecipeSearchScreen = () => {
    const { t } = useAppTranslation();
    const { category: categoryParam } = useLocalSearchParams<{ category?: string }>();
    // A stale deep link with an unknown key falls back to plain search.
    const category = RECIPE_RAIL_CATEGORIES.some(item => item.key === categoryParam) ? categoryParam : undefined;
    const [query, setQuery] = useState('');

    const normalized = query.trim().toLowerCase();

    const ingredientResults = useMemo(
        () => MOCK_SEARCH_INGREDIENTS.filter(item => item.title.toLowerCase().includes(normalized)),
        [normalized],
    );

    const dishResults = useMemo(() => {
        if (category) return MOCK_CATEGORY_DISHES;
        return MOCK_SEARCH_DISHES.filter(dish => dish.title.toLowerCase().includes(normalized));
    }, [category, normalized]);

    const handleResultPress = useCallback(
        (_id: string) => {
            // TODO: product details once designed.
            ToastService.info(t('common:states.coming-soon'));
        },
        [t],
    );

    const handleDishPress = useCallback((id: string) => {
        router.push({ pathname: '/(app)/meal-details', params: { id } });
    }, []);

    return {
        categoryKey: category,
        categoryLabelKey: category ? `recipes:rail-categories.${category}` : undefined,
        query,
        setQuery,
        ingredientResults,
        dishResults,
        handleClear: () => setQuery(''),
        handleCategoryPress: (key: string) =>
            router.push({ pathname: '/(app)/recipe-search', params: { category: key } }),
        handleFilterPress: () => router.push('/(app)/recipes-filter'),
        handleResultPress,
        handleDishPress,
    };
};
