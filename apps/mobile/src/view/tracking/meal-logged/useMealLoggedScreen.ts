import { useCallback, useMemo } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import { formatThousands, toIsoDay } from '@/shared/helpers';
import { useGetDay } from '@/state/domains/nutrition';

export const useMealLoggedScreen = () => {
    const params = useLocalSearchParams<{ id?: string; date?: string }>();
    const date = typeof params.date === 'string' && params.date ? params.date : toIsoDay();

    /**
     * The receipt reads the entry the server created, and the remaining
     * budget from the same day it landed in — deriving either from what the
     * sheet last had on screen would let the two disagree with the ring the
     * user sees a second later.
     */
    const { data: day, isLoading, isError, refetch } = useGetDay(date);

    const entry = useMemo(() => day?.meals.find(meal => meal.id === params.id), [day, params.id]);

    const goalCalories = day?.goal?.dailyCalories ?? 0;
    const consumed = day?.consumed.calories ?? 0;
    const remaining = Math.max(goalCalories - consumed, 0);

    const handleDone = useCallback(() => {
        router.dismissTo('/(app)/(tabs)/home');
    }, []);

    return {
        isLoading,
        isError,
        handleRetry: refetch,
        dish: {
            title: entry?.dishName ?? '',
            // Кухня належить рецепту, а не запису журналу: запис — це знімок
            // зʼїденого, і з часом рецепт може змінитись.
            cuisine: '',
            calories: formatThousands(Math.round(entry?.calories ?? 0)),
            grams: Math.round(entry?.weightG ?? 0),
            macros: {
                protein: Math.round(entry?.proteinG ?? 0),
                fats: Math.round(entry?.fatsG ?? 0),
                carbs: Math.round(entry?.carbsG ?? 0),
            },
        },
        remainingCalories: formatThousands(remaining),
        goalCalories: formatThousands(goalCalories),
        goalProgress: goalCalories > 0 ? consumed / goalCalories : 0,
        handleDone,
    };
};
