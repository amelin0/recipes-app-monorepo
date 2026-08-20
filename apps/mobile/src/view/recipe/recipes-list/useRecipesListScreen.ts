import { useCallback, useMemo, useState } from 'react';

import { router } from 'expo-router';

import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';
import { countRecipeFilters, type RecipeFilterGroup } from '@/state/domains/recipe';

import { MOCK_RECIPES } from '../recipe.constants';

export type RecipesTab = 'all' | 'favorites' | 'own';
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
    const [favorites, setFavorites] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(MOCK_RECIPES.map(recipe => [recipe.id, recipe.isFavorite])),
    );

    const recipes = useMemo(() => {
        const withFavorites = MOCK_RECIPES.map(recipe => ({ ...recipe, isFavorite: favorites[recipe.id] ?? false }));
        if (activeTab === 'favorites') return withFavorites.filter(recipe => recipe.isFavorite);
        if (activeTab === 'own') return withFavorites.filter(recipe => recipe.isOwn);
        return withFavorites;
    }, [activeTab, favorites]);

    const sectionTitle =
        activeTab === 'favorites'
            ? t('recipes:list.favorites-section')
            : activeTab === 'own'
              ? t('recipes:list.own-section')
              : t('recipes:list.section');

    // Applied chips carry plain labels — the design strips the option emojis (594:44769).
    const appliedFilters = useMemo<AppliedFilterChip[]>(() => {
        const chips: AppliedFilterChip[] = [];
        recipeFilters.ingredients.forEach(value =>
            chips.push({
                key: `ingredients-${value}`,
                group: 'ingredients',
                value,
                label: t(`recipes:ingredients.${value}`),
            }),
        );
        recipeFilters.categories.forEach(value =>
            chips.push({
                key: `categories-${value}`,
                group: 'categories',
                value,
                label: t(`recipes:rail-categories.${value}`),
            }),
        );
        (['products', 'cuisines', 'diets'] as const).forEach(group => {
            recipeFilters[group].forEach(value =>
                chips.push({ key: `${group}-${value}`, group, value, label: t(`recipes:options.${value}`) }),
            );
        });
        return chips;
    }, [recipeFilters, t]);

    const handleToggleFavorite = useCallback((id: string) => {
        // TODO: PUT /recipes/:id/favorite once the API ships.
        setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
    }, []);

    const handleRecipePress = useCallback((id: string) => {
        router.push({ pathname: '/(app)/meal-details', params: { id } });
    }, []);

    return {
        activeTab,
        setActiveTab: (key: string) => setActiveTab(key as RecipesTab),
        viewMode,
        setViewMode,
        recipes,
        sectionTitle,
        appliedFilters,
        filtersCount: countRecipeFilters(recipeFilters),
        handleSearchPress: () => router.push('/(app)/recipe-search'),
        handleFilterPress: () => router.push('/(app)/recipes-filter'),
        handleCategoryPress: (category: string) =>
            router.push({ pathname: '/(app)/recipe-search', params: { category } }),
        handleRecipePress,
        handleToggleFavorite,
        handleRemoveFilter: (chip: AppliedFilterChip) => toggleRecipeFilter(chip.group, chip.value),
        // «Додати рецепт» — форма власної страви без план-контексту (594:31930).
        handleAddRecipePress: () => router.push('/(app)/create-dish'),
    };
};
