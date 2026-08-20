import { useCallback, useMemo, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import { useDebouncedValue } from '@/shared/hooks';
import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';
import { buildPlanDish, pickedInMeal, pickedPlanId, resolvePlanTarget } from '@/state/domains/meal-plan';

import {
    MOCK_CATEGORY_DISHES,
    MOCK_SEARCH_DISHES,
    MOCK_SEARCH_INGREDIENTS,
    RECIPE_RAIL_CATEGORIES,
    type SearchDishResult,
} from '../recipe.constants';

export const useRecipeSearchScreen = () => {
    const { t } = useAppTranslation();
    const params = useLocalSearchParams<{
        category?: string;
        picker?: string;
        day?: string;
        meal?: string;
        q?: string;
    }>();
    const categoryParam = typeof params.category === 'string' ? params.category : undefined;
    // A stale deep link with an unknown key falls back to plain search.
    const category = RECIPE_RAIL_CATEGORIES.some(item => item.key === categoryParam) ? categoryParam : undefined;
    // Діплінк може передати початковий запит (rationfit://recipe-search?q=…).
    const [query, setQuery] = useState(() => (typeof params.q === 'string' ? params.q : ''));

    // Відкрито з пікера страв — результати додаються прямо до прийому (594:41918).
    const isPicker = params.picker === '1';
    const planWeek = useStore(state => state.planWeek);
    const addPlanDishes = useStore(state => state.addPlanDishes);
    const removePlanDish = useStore(state => state.removePlanDish);
    const { day, meal } = resolvePlanTarget(planWeek, params.day, params.meal);
    // Спільний зі стором стан «додано» — бачить і додавання з деталей.
    const picked = pickedInMeal(planWeek, day, meal);

    // Сітка категорій лишається, доки відкладений запит порожній (594:43001);
    // очищення поля скидає результати одразу, без вікна дебаунсу.
    const debounced = useDebouncedValue(query);
    const debouncedQuery = query.length === 0 ? '' : debounced;
    const normalized = debouncedQuery.trim().toLowerCase();

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

    const handleDishPress = useCallback(
        (id: string) => {
            // У режимі пікера деталі відкриваються з CTA «Додати до раціону».
            if (isPicker) {
                router.push({ pathname: '/(app)/meal-details', params: { id, mode: 'plan', day, meal } });
                return;
            }
            router.push({ pathname: '/(app)/meal-details', params: { id } });
        },
        [isPicker, day, meal],
    );

    // Той самий тогл, що й у пікері: тік читається зі стору.
    const handleToggleSearchDish = useCallback(
        (dish: SearchDishResult) => {
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
        },
        [picked, addPlanDishes, removePlanDish, day, meal],
    );

    return {
        categoryKey: category,
        categoryLabelKey: category ? `recipes:rail-categories.${category}` : undefined,
        query,
        debouncedQuery,
        setQuery,
        ingredientResults,
        dishResults,
        isPicker,
        isAdded: picked.isAdded,
        handleToggleSearchDish,
        handleClear: () => setQuery(''),
        // Контекст пікера їде разом у режим категорії (594:41918).
        handleCategoryPress: (key: string) =>
            router.push({
                pathname: '/(app)/recipe-search',
                params: isPicker ? { category: key, picker: '1', day, meal } : { category: key },
            }),
        handleFilterPress: () => router.push('/(app)/recipes-filter'),
        handleResultPress,
        handleDishPress,
    };
};
