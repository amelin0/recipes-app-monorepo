import { useCallback, useMemo, useState } from 'react';

import { router } from 'expo-router';

import type { RecipeTab } from '@/data';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';
import { useGetRecipeFilters, useGetRecipes, useToggleFavorite } from '@/state/domains/catalog';
import { countRecipeFilters, RECIPE_FILTER_GROUPS, type RecipeFilterGroup } from '@/state/domains/recipe';

import { useRecipeQuery } from '../useRecipeQuery';

export type RecipesTab = RecipeTab;
export type RecipesViewMode = 'grid' | 'list';

export interface AppliedFilterChip {
    key: string;
    group: RecipeFilterGroup;
    value: string;
    label: string;
}

export const useRecipesListScreen = () => {
    const { t } = useAppTranslation(['recipes', 'common']);
    const recipeFilters = useStore(state => state.recipeFilters);
    const toggleRecipeFilter = useStore(state => state.toggleRecipeFilter);

    const [activeTab, setActiveTab] = useState<RecipesTab>('all');
    const [viewMode, setViewMode] = useState<RecipesViewMode>('grid');

    const query = useRecipeQuery(activeTab);
    const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetRecipes(query);
    const { data: filterOptions } = useGetRecipeFilters();
    const toggleFavorite = useToggleFavorite();

    const recipes = useMemo(() => data?.pages.flatMap(page => page.data) ?? [], [data]);
    const total = data?.pages[0]?.meta.total ?? 0;

    const sectionTitle =
        activeTab === 'favorite'
            ? t('recipes:list.favorites-section')
            : activeTab === 'own'
              ? t('recipes:list.own-section')
              : t('recipes:list.section');

    /**
     * Chips carry names, but the store keeps ids — so the labels are resolved
     * against the filter payload. Until it arrives a selection has no name to
     * show, and a chip reading its own uuid would be worse than none.
     */
    const appliedFilters = useMemo<AppliedFilterChip[]>(() => {
        if (!filterOptions) return [];

        // Products carry more than a reference does, but only `id` and `name`
        // are needed here — narrowed so the two shapes line up.
        const byGroup: Record<RecipeFilterGroup, { id: string; name: string }[]> = {
            products: filterOptions.quickProducts,
            productGroups: filterOptions.productGroups,
            categories: filterOptions.categories,
            cuisines: filterOptions.cuisines,
            diets: filterOptions.diets,
        };

        return RECIPE_FILTER_GROUPS.flatMap(group =>
            recipeFilters[group].flatMap(value => {
                const option = byGroup[group].find(item => item.id === value);
                return option ? [{ key: `${group}-${value}`, group, value, label: option.name }] : [];
            }),
        );
    }, [filterOptions, recipeFilters]);

    const handleToggleFavorite = useCallback(
        (id: string) => {
            const recipe = recipes.find(item => item.id === id);
            if (!recipe) return;
            toggleFavorite.mutate({ id, isFavorite: recipe.isFavorite });
        },
        [recipes, toggleFavorite],
    );

    const handleRecipePress = useCallback((id: string) => {
        router.push({ pathname: '/(app)/meal-details', params: { id } });
    }, []);

    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    return {
        activeTab,
        setActiveTab: (key: string) => setActiveTab(key as RecipesTab),
        viewMode,
        setViewMode,
        recipes,
        total,
        isLoading,
        isError,
        isEmpty: !isLoading && !isError && recipes.length === 0,
        handleRetry: refetch,
        handleEndReached,
        isFetchingNextPage,
        categories: filterOptions?.categories ?? [],
        sectionTitle,
        appliedFilters,
        filtersCount: countRecipeFilters(recipeFilters),
        handleSearchPress: () => router.push('/(app)/recipe-search'),
        handleFilterPress: () => router.push('/(app)/recipes-filter'),
        handleCategoryPress: (categoryId: string) =>
            router.push({ pathname: '/(app)/recipe-search', params: { category: categoryId } }),
        handleRecipePress,
        handleToggleFavorite,
        handleRemoveFilter: (chip: AppliedFilterChip) => toggleRecipeFilter(chip.group, chip.value),
        // «Додати рецепт» — форма власної страви без план-контексту (594:31930).
        handleAddRecipePress: () => router.push('/(app)/create-dish'),
    };
};
