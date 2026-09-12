import { useCallback, useMemo, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import { toIsoDay } from '@/shared/helpers';
import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useGetRecipe } from '@/state/domains/catalog';
import { resolvePlanMeal, type PlanMealKey } from '@/state/domains/meal-plan';
import { useLogMeal } from '@/state/domains/nutrition';

import { RECIPE_PLACEHOLDER_IMAGE } from '../recipe.constants';

const PORTION_MIN = 1;
const PORTION_MAX = 20;
/** How much of the dish the plate starts on. */
const DEFAULT_SHARE = 0.5;

export const useMealPortionsScreen = () => {
    const { t } = useAppTranslation(['common']);
    const params = useLocalSearchParams<{ id?: string; slot?: string; date?: string }>();
    const recipeId = typeof params.id === 'string' ? params.id : '';

    const { data: recipe, isLoading, isError, refetch } = useGetRecipe(recipeId);
    const logMeal = useLogMeal();

    const [portions, setPortions] = useState(PORTION_MIN);
    const [share, setShare] = useState(DEFAULT_SHARE);

    const per = useMemo(
        () => ({
            grams: recipe?.perServing.weightG ?? 0,
            kcal: recipe?.perServing.calories ?? 0,
            protein: recipe?.perServing.proteinG ?? 0,
            fats: recipe?.perServing.fatsG ?? 0,
            carbs: recipe?.perServing.carbsG ?? 0,
        }),
        [recipe],
    );

    // What the user actually ate: their share of everything that was cooked.
    const myMacros = useMemo(() => {
        const eaten = portions * share;

        return {
            kcal: Math.round(per.kcal * eaten),
            protein: Math.round(per.protein * eaten),
            fats: Math.round(per.fats * eaten),
            carbs: Math.round(per.carbs * eaten),
        };
    }, [per, portions, share]);

    const handleConfirm = useCallback(() => {
        if (!recipe || logMeal.isPending) return;

        const slot: PlanMealKey = resolvePlanMeal(params.slot);
        const date = typeof params.date === 'string' && params.date ? params.date : toIsoDay();

        // Сервер сам масштабує на порції й частку — надсилаємо норму однієї
        // порції, щоб множення було в одному місці.
        logMeal.mutate(
            {
                date,
                slot,
                recipeId: recipe.id,
                dishName: recipe.title,
                portions,
                eatenFraction: share,
                perPortion: {
                    calories: per.kcal,
                    proteinG: per.protein,
                    fatsG: per.fats,
                    carbsG: per.carbs,
                    weightG: per.grams || 100,
                },
            },
            {
                onSuccess: entry =>
                    router.replace({
                        pathname: '/(app)/meal-logged',
                        params: { id: entry.id, date },
                    }),
                onError: () => ToastService.error(t('common:states.error')),
            },
        );
    }, [logMeal, params.date, params.slot, per, portions, recipe, share, t]);

    return {
        image: recipe?.photoUrl ? { uri: recipe.photoUrl } : RECIPE_PLACEHOLDER_IMAGE,
        isLoading,
        isError,
        handleRetry: refetch,
        isSubmitting: logMeal.isPending,
        portions,
        share,
        setShare,
        canDecrease: portions > PORTION_MIN,
        myMacros,
        totalGrams: Math.round(per.grams * portions),
        handleDecrease: () => setPortions(prev => Math.max(prev - 1, PORTION_MIN)),
        handleIncrease: () => setPortions(prev => Math.min(prev + 1, PORTION_MAX)),
        handleClose: () => router.back(),
        handleConfirm,
    };
};
