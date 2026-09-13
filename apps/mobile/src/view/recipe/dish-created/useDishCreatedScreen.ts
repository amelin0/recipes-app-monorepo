import { useCallback, useRef } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useGetRecipe } from '@/state/domains/catalog';
import { resolvePlanDate, resolvePlanMeal, useAddPlanItem } from '@/state/domains/meal-plan';

import { RECIPE_PLACEHOLDER_IMAGE } from '../recipe.constants';

export const useDishCreatedScreen = () => {
    const { t } = useAppTranslation(['common']);
    // Флоу створення передає створену страву й прийом, з якого стартував (628:27032).
    const params = useLocalSearchParams<{ id?: string; day?: string; meal?: string }>();
    const recipeId = typeof params.id === 'string' ? params.id : '';

    const { data: recipe } = useGetRecipe(recipeId);
    const addPlanItem = useAddPlanItem();

    const day = resolvePlanDate(params.day);
    const meal = resolvePlanMeal(params.meal);

    // Створення без план-контексту веде до страви, а не до раціону (628:25123).
    const hasPlanContext = typeof params.day === 'string' && params.day.length > 0;

    const added = useRef(false);

    const handleAddToRation = useCallback(() => {
        if (added.current || !recipeId || addPlanItem.isPending) return;
        added.current = true;

        addPlanItem.mutate(
            { date: day, slot: meal, recipeId },
            {
                onSuccess: () => router.replace('/(app)/(tabs)/meal-plan'),
                onError: () => {
                    added.current = false;
                    ToastService.error(t('common:states.error'));
                },
            },
        );
    }, [addPlanItem, day, meal, recipeId, t]);

    return {
        dish: {
            id: recipeId,
            title: recipe?.title ?? '',
            emoji: '🍽️',
            image: recipe?.photoUrl ? { uri: recipe.photoUrl } : RECIPE_PLACEHOLDER_IMAGE,
            cuisine: recipe?.cuisine?.name ?? '',
            weightGrams: Math.round(recipe?.perServing.weightG ?? 0),
            cookTimeMinutes: recipe?.cookTimeMinutes ?? null,
            kcal: Math.round(recipe?.perServing.calories ?? 0),
            protein: Math.round(recipe?.perServing.proteinG ?? 0),
            fats: Math.round(recipe?.perServing.fatsG ?? 0),
            carbs: Math.round(recipe?.perServing.carbsG ?? 0),
        },
        hasPlanContext,
        isAdding: addPlanItem.isPending,
        // Той самий шлях, що й «Відмітити прийом їжі» в деталях страви.
        handleLogMeal: () => router.push({ pathname: '/(app)/meal-portions', params: { id: recipeId } }),
        handleAddToRation,
        handleGoHome: () => router.replace('/(app)/(tabs)/home'),
    };
};
