import { useCallback, useMemo, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import type { Product, RecipeCard } from '@/data';
import { useDebouncedValue } from '@/shared/hooks';
import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useGetProducts, useGetRecipeFilters, useGetRecipes } from '@/state/domains/catalog';
import {
    resolvePlanDate,
    resolvePlanMeal,
    useAddPlanItem,
    useGetPlan,
    useRemovePlanItem,
} from '@/state/domains/meal-plan';

export const useRecipeSearchScreen = () => {
    const { t } = useAppTranslation();
    const params = useLocalSearchParams<{
        category?: string;
        picker?: string;
        day?: string;
        meal?: string;
        q?: string;
    }>();

    const { data: filterOptions } = useGetRecipeFilters();

    const categoryParam = typeof params.category === 'string' ? params.category : undefined;
    // A stale deep link with an unknown id falls back to plain search.
    const category = filterOptions?.categories.find(item => item.id === categoryParam);

    // Діплінк може передати початковий запит (rationfit://recipe-search?q=…).
    const [query, setQuery] = useState(() => (typeof params.q === 'string' ? params.q : ''));

    // Відкрито з пікера страв — результати додаються прямо до прийому (594:41918).
    const isPicker = params.picker === '1';
    const day = resolvePlanDate(params.day);
    const meal = resolvePlanMeal(params.meal);

    const addItem = useAddPlanItem();
    const removeItem = useRemovePlanItem();
    // Тік читається з самого плану — те саме джерело, що й у пікері.
    const { data: planDays } = useGetPlan(day, day);
    const plannedItems = useMemo(
        () => (isPicker ? (planDays?.[0]?.slots.find(slot => slot.slot === meal)?.items ?? []) : []),
        [isPicker, meal, planDays],
    );
    const plannedItemOf = useCallback(
        (recipeId: string) => plannedItems.find(item => item.recipe.id === recipeId)?.id ?? null,
        [plannedItems],
    );

    // Сітка категорій лишається, доки відкладений запит порожній (594:43001);
    // очищення поля скидає результати одразу, без вікна дебаунсу.
    const debounced = useDebouncedValue(query);
    const debouncedQuery = query.length === 0 ? '' : debounced;
    const normalized = debouncedQuery.trim();

    // У режимі категорії шукаємо по ній, інакше — за текстом. Обидва запити
    // вимкнені, доки нема ні того, ні того: інакше відкриття екрана коштувало б
    // повного читання каталогу.
    const hasSearch = normalized.length > 0 || Boolean(category);

    const { data: recipePages, isFetching: isFetchingRecipes } = useGetRecipes(
        hasSearch
            ? {
                  ...(normalized ? { q: normalized } : {}),
                  ...(category ? { categories: [category.id] } : {}),
              }
            : {},
    );

    const { data: productPages, isFetching: isFetchingProducts } = useGetProducts(normalized ? { q: normalized } : {});

    const dishResults: RecipeCard[] = useMemo(
        () => (hasSearch ? (recipePages?.pages.flatMap(page => page.data) ?? []) : []),
        [hasSearch, recipePages],
    );

    const ingredientResults: Product[] = useMemo(
        () => (normalized ? (productPages?.pages.flatMap(page => page.data) ?? []) : []),
        [normalized, productPages],
    );

    const handleResultPress = useCallback(
        (_id: string) => {
            // TODO: екран продукту ще не спроєктований.
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

    // Той самий тогл, що й у пікері.
    const handleToggleSearchDish = useCallback(
        (dish: RecipeCard) => {
            if (addItem.isPending || removeItem.isPending) return;

            const itemId = plannedItemOf(dish.id);
            if (itemId) {
                removeItem.mutate(
                    { date: day, itemId },
                    { onError: () => ToastService.error(t('common:states.error')) },
                );
                return;
            }

            addItem.mutate(
                { date: day, slot: meal, recipeId: dish.id },
                { onError: () => ToastService.error(t('common:states.error')) },
            );
        },
        [addItem, day, meal, plannedItemOf, removeItem, t],
    );

    return {
        categoryKey: category?.id,
        categoryLabel: category?.name,
        categories: filterOptions?.categories ?? [],
        query,
        debouncedQuery,
        setQuery,
        ingredientResults,
        dishResults,
        isSearching: isFetchingRecipes || isFetchingProducts,
        isPicker,
        isAdded: (recipeId: string) => plannedItemOf(recipeId) !== null,
        handleToggleSearchDish,
        handleClear: () => setQuery(''),
        // Контекст пікера їде разом у режим категорії (594:41918).
        handleCategoryPress: (id: string) =>
            router.push({
                pathname: '/(app)/recipe-search',
                params: isPicker ? { category: id, picker: '1', day, meal } : { category: id },
            }),
        handleFilterPress: () => router.push('/(app)/recipes-filter'),
        handleResultPress,
        handleDishPress,
    };
};
