import { useEffect, useMemo, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';
import { PLAN_MEAL_KEYS, type PlanDish } from '@/state/domains/meal-plan';
import { countRecipeFilters, type RecipeFilterGroup } from '@/state/domains/recipe';

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

const toPlanDish = (dish: PickerDish, planId: string): PlanDish => ({
    id: planId,
    emoji: dish.emoji,
    name: dish.title,
    calories: dish.kcal,
    macros: [
        { key: 'protein', value: dish.protein },
        { key: 'fats', value: dish.fats },
        { key: 'carbs', value: dish.carbs },
    ],
});

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
    const dayParam = typeof params.day === 'string' ? params.day : undefined;
    const mealParam = typeof params.meal === 'string' ? params.meal : undefined;
    const day = dayParam !== undefined && planWeek.some(planDay => planDay.key === dayParam) ? dayParam : 'mon';
    const meal = PLAN_MEAL_KEYS.find(key => key === mealParam) ?? 'lunch';

    const [activeTab, setActiveTab] = useState<AddDishTabKey>('dishes');

    /** Quick rail pick — local, unlike the filter screen's shared set (594:30462). */
    const [railCategory, setRailCategory] = useState<string | null>(null);
    // pickerId → the unique id the dish got in the plan (the plan may already
    // hold the same mock dish, so ids must not collide).
    const [added, setAdded] = useState<Record<string, string>>({});

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
        if (railCategory !== null) return MOCK_PICKER_DISHES.filter(dish => dish.category === railCategory);
        if (categoryFilters.length > 0)
            return MOCK_PICKER_DISHES.filter(dish => categoryFilters.includes(dish.category));
        return MOCK_PICKER_DISHES;
    }, [railCategory, categoryFilters]);

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
        const planId = added[dish.id];
        if (planId) {
            removePlanDish(day, meal, planId);
            setAdded(prev => {
                const { [dish.id]: _removed, ...rest } = prev;
                return rest;
            });
            return;
        }
        const newId = `${dish.id}-${Date.now()}`;
        addPlanDishes(day, meal, [toPlanDish(dish, newId)]);
        setAdded(prev => ({ ...prev, [dish.id]: newId }));
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
        // «Інгредієнти» завжди цитує мок-загал (594:30951); списки страв
        // показують довжину, щойно діє будь-яке звуження (594:31262).
        resultsCount:
            activeTab !== 'ingredients' && (railCategory !== null || appliedFilters.length > 0)
                ? dishes.length
                : MOCK_PICKER_RESULTS_COUNT,
        dishes,
        ingredients: MOCK_PICKER_INGREDIENTS,
        isAdded: (dishId: string) => Boolean(added[dishId]),
        addedCount: Object.keys(added).length,
        handleToggleDish,
        handleCreateDish,
        // TODO: пошук у пікері — дизайну ще немає.
        handleSearchPress: () => ToastService.info(t('common:states.coming-soon')),
        handleFilterPress: () => router.push('/(app)/recipes-filter'),
        // TODO: додавання інгредієнта як страви прийому — контракт уточнюється.
        handleIngredientPress: () => ToastService.info(t('common:states.coming-soon')),
        handleDone: () => {
            if (router.canGoBack()) router.back();
        },
    };
};
