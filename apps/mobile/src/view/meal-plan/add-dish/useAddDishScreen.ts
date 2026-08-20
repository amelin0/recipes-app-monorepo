import { useEffect, useMemo, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';
import { countRecipeFilters, type RecipeFilterGroup } from '@/state/domains/recipe';

import { buildPlanDish, pickedInMeal, pickedPlanId, resolvePlanTarget } from '@/state/domains/meal-plan';

import { RECIPE_RAIL_CATEGORIES } from '../../recipe/recipe.constants';
import {
    ADD_DISH_TABS,
    MOCK_PICKER_DISHES,
    MOCK_PICKER_INGREDIENTS,
    MOCK_PICKER_RESULTS_COUNT,
    type AddDishTabKey,
    type PickerDish,
} from '../meal-plan.constants';

export interface AppliedFilterChip {
    key: string;
    group: RecipeFilterGroup;
    value: string;
    label: string;
}

export const useAddDishScreen = () => {
    const { t } = useAppTranslation(['meal-plan', 'recipes', 'common']);
    const params = useLocalSearchParams<{ day?: string; meal?: string }>();

    const planWeek = useStore(state => state.planWeek);
    const recipeFilters = useStore(state => state.recipeFilters);
    const toggleRecipeFilter = useStore(state => state.toggleRecipeFilter);
    const addPlanDishes = useStore(state => state.addPlanDishes);
    const removePlanDish = useStore(state => state.removePlanDish);

    // A deep link may carry anything — an unknown day/meal must not silently
    // no-op in the store while the rows still flip to «додано».
    const { day, meal } = resolvePlanTarget(planWeek, params.day, params.meal);

    // Тік і лічильник читаються зі стору — додавання з деталей страви
    // (984:58839) підсвічує рядок так само, як «+» у списку.
    const picked = pickedInMeal(planWeek, day, meal);

    const [activeTab, setActiveTab] = useState<AddDishTabKey>('dishes');

    /** Quick rail pick — local, unlike the filter screen's shared set (594:30462). */
    const [railCategory, setRailCategory] = useState<string | null>(null);

    // Applied chips mirror the recipes tab (594:30640) — plain labels, removable.
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

    // Мок звужується рейкою або категоріями зі спільних фільтрів (594:31262);
    // решту груп (інгредієнти, продукти, кухні, дієти, ккал) фільтрує система.
    const categoryFilters = recipeFilters.categories;
    const dishes = useMemo(() => {
        const base =
            activeTab === 'favorites' ? MOCK_PICKER_DISHES.filter(dish => dish.isFavorite) : MOCK_PICKER_DISHES;
        if (railCategory !== null) return base.filter(dish => dish.category === railCategory);
        if (categoryFilters.length > 0) return base.filter(dish => categoryFilters.includes(dish.category));
        return base;
    }, [activeTab, railCategory, categoryFilters]);

    // The chips replace the rail (594:30640) — a hidden rail pick must not keep
    // narrowing the list with nothing to show or clear it.
    useEffect(() => {
        if (appliedFilters.length > 0) setRailCategory(null);
    }, [appliedFilters.length]);

    // TODO: створення власної страви — флоу ще не задизайнений (594:31406).
    const handleCreateDish = () => ToastService.info(t('common:states.coming-soon'));

    const handleTabChange = (key: string) => {
        // «Створити» — власна страва, флоу ще не задизайнений.
        if (key === 'create') {
            handleCreateDish();
            return;
        }
        setActiveTab(key as AddDishTabKey);
        // The rail lives on «Страви» only — its pick must not follow to other tabs.
        setRailCategory(null);
    };

    const handleToggleDish = (dish: PickerDish) => {
        const planId = picked.lastPlanIdOf(dish.id);
        if (planId !== null) {
            removePlanDish(day, meal, planId);
            return;
        }
        addPlanDishes(day, meal, [
            buildPlanDish({
                id: pickedPlanId(dish.id),
                emoji: dish.emoji,
                name: dish.title,
                calories: dish.kcal,
                protein: dish.protein,
                fats: dish.fats,
                carbs: dish.carbs,
            }),
        ]);
    };

    return {
        mealKey: meal,
        activeTab,
        tabs: ADD_DISH_TABS,
        handleTabChange,
        railCategory,
        railCategories: RECIPE_RAIL_CATEGORIES,
        handleRailPress: (key: string) => setRailCategory(prev => (prev === key ? null : key)),
        appliedFilters,
        filtersCount: countRecipeFilters(recipeFilters),
        handleRemoveFilter: (chip: AppliedFilterChip) => toggleRecipeFilter(chip.group, chip.value),
        // «Інгредієнти» завжди цитує мок-загал (594:30951); «Улюблені» —
        // власну довжину (594:31435); решта списків — кількість збігів,
        // щойно діє будь-яке звуження (594:31262).
        resultsCount:
            activeTab === 'favorites'
                ? dishes.length
                : activeTab !== 'ingredients' && (railCategory !== null || appliedFilters.length > 0)
                  ? dishes.length
                  : MOCK_PICKER_RESULTS_COUNT,
        dishes,
        ingredients: MOCK_PICKER_INGREDIENTS,
        isAdded: picked.isAdded,
        addedCount: picked.addedCount,
        handleToggleDish,
        // Тап по рядку — деталі страви з CTA «Додати до раціону» (984:58839).
        handleDishPress: (dishId: string) =>
            router.push({ pathname: '/(app)/meal-details', params: { id: dishId, mode: 'plan', day, meal } }),
        handleCreateDish,
        // Пошук у режимі пікера — результати додаються до цього прийому (594:41918).
        handleSearchPress: () => router.push({ pathname: '/(app)/recipe-search', params: { picker: '1', day, meal } }),
        handleFilterPress: () => router.push('/(app)/recipes-filter'),
        // TODO: додавання інгредієнта як страви прийому — контракт уточнюється.
        handleIngredientPress: () => ToastService.info(t('common:states.coming-soon')),
        handleDone: () => {
            if (router.canGoBack()) router.back();
        },
    };
};
