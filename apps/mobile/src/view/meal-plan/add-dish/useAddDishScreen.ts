import { useCallback, useEffect, useMemo, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import type { RecipeTab } from '@/data';
import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';
import { useGetProducts, useGetRecipeFilters, useGetRecipes } from '@/state/domains/catalog';
import {
    useAddPlanItem,
    useGetPlan,
    useRemovePlanItem,
    resolvePlanDate,
    resolvePlanMeal,
} from '@/state/domains/meal-plan';
import { countRecipeFilters, RECIPE_FILTER_GROUPS, type RecipeFilterGroup } from '@/state/domains/recipe';

import { useRecipeQuery } from '../../recipe/useRecipeQuery';
import { ADD_DISH_TABS, type AddDishTabKey } from '../meal-plan.constants';

export interface AppliedFilterChip {
    key: string;
    group: RecipeFilterGroup;
    value: string;
    label: string;
}

/** Which cut of the catalogue each picker tab reads. */
const TAB_TO_RECIPE_TAB: Record<Exclude<AddDishTabKey, 'ingredients' | 'create'>, RecipeTab> = {
    dishes: 'all',
    own: 'own',
    favorites: 'favorite',
};

export const useAddDishScreen = () => {
    const { t } = useAppTranslation(['meal-plan', 'recipes', 'common']);
    const params = useLocalSearchParams<{ day?: string; meal?: string }>();

    const day = resolvePlanDate(params.day);
    const meal = resolvePlanMeal(params.meal);

    const { data: filterOptions } = useGetRecipeFilters();
    const recipeFilters = useStore(state => state.recipeFilters);
    const toggleRecipeFilter = useStore(state => state.toggleRecipeFilter);

    const addItem = useAddPlanItem();
    const removeItem = useRemovePlanItem();

    // Тік читається з самого плану, а не з локального набору: додавання з
    // деталей страви має підсвічувати той самий рядок, і другого джерела
    // правди для «вже додано» бути не повинно.
    const { data: planDays } = useGetPlan(day, day);
    const plannedItems = useMemo(
        () => planDays?.[0]?.slots.find(slot => slot.slot === meal)?.items ?? [],
        [meal, planDays],
    );

    const [activeTab, setActiveTab] = useState<AddDishTabKey>('dishes');

    /** Quick rail pick — local, unlike the filter screen's shared set (594:30462). */
    const [railCategory, setRailCategory] = useState<string | null>(null);

    // Applied chips mirror the recipes tab (594:30640) — labels resolved from
    // the filter payload because the store keeps ids.
    const appliedFilters = useMemo<AppliedFilterChip[]>(() => {
        if (!filterOptions) return [];

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

    const recipeTab = activeTab === 'ingredients' || activeTab === 'create' ? 'all' : TAB_TO_RECIPE_TAB[activeTab];
    const baseQuery = useRecipeQuery(recipeTab);
    // Рейка звужує понад спільні фільтри й живе лише на цьому екрані.
    const query = useMemo(
        () => (railCategory ? { ...baseQuery, categories: [railCategory] } : baseQuery),
        [baseQuery, railCategory],
    );

    const { data: recipePages, isLoading: isLoadingDishes, isError: isDishesError, refetch } = useGetRecipes(query);
    const dishes = useMemo(() => recipePages?.pages.flatMap(page => page.data) ?? [], [recipePages]);
    const dishesTotal = recipePages?.pages[0]?.meta.total ?? 0;

    const { data: productPages } = useGetProducts();
    const ingredients = useMemo(() => productPages?.pages.flatMap(page => page.data) ?? [], [productPages]);
    const ingredientsTotal = productPages?.pages[0]?.meta.total ?? 0;

    // The chips replace the rail (594:30640) — a hidden rail pick must not keep
    // narrowing the list with nothing to show or clear it.
    useEffect(() => {
        if (appliedFilters.length > 0) setRailCategory(null);
    }, [appliedFilters.length]);

    // Створення власної страви — форма з контекстом прийому (594:31930).
    const handleCreateDish = () => router.push({ pathname: '/(app)/create-dish', params: { day, meal } });

    const handleTabChange = (key: string) => {
        // «Створити» відкриває форму власної страви замість зміни вкладки.
        if (key === 'create') {
            handleCreateDish();
            return;
        }
        setActiveTab(key as AddDishTabKey);
        // The rail lives on «Страви» only — its pick must not follow to other tabs.
        setRailCategory(null);
    };

    /** The plan item holding this recipe in this meal, if any. */
    const plannedItemOf = useCallback(
        (recipeId: string) => plannedItems.find(item => item.recipe.id === recipeId)?.id ?? null,
        [plannedItems],
    );

    const handleToggleDish = useCallback(
        (recipeId: string) => {
            if (addItem.isPending || removeItem.isPending) return;

            const itemId = plannedItemOf(recipeId);
            if (itemId) {
                removeItem.mutate(
                    { date: day, itemId },
                    { onError: () => ToastService.error(t('common:states.error')) },
                );
                return;
            }

            addItem.mutate(
                { date: day, slot: meal, recipeId },
                { onError: () => ToastService.error(t('common:states.error')) },
            );
        },
        [addItem, day, meal, plannedItemOf, removeItem, t],
    );

    return {
        mealKey: meal,
        activeTab,
        tabs: ADD_DISH_TABS,
        handleTabChange,
        railCategory,
        railCategories: filterOptions?.categories ?? [],
        handleRailPress: (id: string) => setRailCategory(prev => (prev === id ? null : id)),
        appliedFilters,
        filtersCount: countRecipeFilters(recipeFilters),
        handleRemoveFilter: (chip: AppliedFilterChip) => toggleRecipeFilter(chip.group, chip.value),
        isLoading: isLoadingDishes,
        isError: isDishesError,
        handleRetry: refetch,
        resultsCount: activeTab === 'ingredients' ? ingredientsTotal : dishesTotal,
        dishes,
        ingredients,
        isAdded: (recipeId: string) => plannedItemOf(recipeId) !== null,
        addedCount: plannedItems.length,
        handleToggleDish,
        // Тап по рядку — деталі страви з CTA «Додати до раціону» (984:58839).
        handleDishPress: (recipeId: string) =>
            router.push({ pathname: '/(app)/meal-details', params: { id: recipeId, mode: 'plan', day, meal } }),
        handleCreateDish,
        // Пошук у режимі пікера — результати додаються до цього прийому (594:41918).
        handleSearchPress: () => router.push({ pathname: '/(app)/recipe-search', params: { picker: '1', day, meal } }),
        handleFilterPress: () => router.push('/(app)/recipes-filter'),
        // TODO: додавання окремого продукту як страви прийому — план приймає
        // лише рецепти (`AddPlanItemInboundDto` несе `recipeId`).
        handleIngredientPress: () => ToastService.info(t('common:states.coming-soon')),
        handleDone: () => {
            if (router.canGoBack()) router.back();
        },
    };
};
