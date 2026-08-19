import { useCallback, useMemo } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import { formatThousands } from '@/shared/helpers';

import { MOCK_MEAL_DETAIL } from '../../recipe/recipe.constants';

/** Daily calorie goal the remaining bar is measured against. */
const GOAL_CALORIES = 2000;

export const useMealLoggedScreen = () => {
    // TODO: the logged portion arrives from the entry the API created; the
    // remaining budget comes from the day's totals, not from a constant.
    const { portions } = useLocalSearchParams<{ portions?: string }>();
    const meal = MOCK_MEAL_DETAIL;

    const logged = useMemo(() => {
        const count = Number(portions) || 1;
        const { grams, kcal, protein, fats, carbs } = meal.perPortion;

        return {
            grams: Math.round(grams * count),
            calories: Math.round(kcal * count),
            macros: {
                protein: Math.round(protein * count),
                fats: Math.round(fats * count),
                carbs: Math.round(carbs * count),
            },
        };
    }, [meal.perPortion, portions]);

    const remaining = Math.max(GOAL_CALORIES - logged.calories, 0);

    const handleDone = useCallback(() => {
        router.dismissTo('/(app)/(tabs)/home');
    }, []);

    return {
        dish: {
            title: meal.title,
            cuisine: meal.cuisine,
            calories: formatThousands(logged.calories),
            grams: logged.grams,
            macros: logged.macros,
        },
        remainingCalories: formatThousands(remaining),
        goalCalories: formatThousands(GOAL_CALORIES),
        goalProgress: GOAL_CALORIES > 0 ? logged.calories / GOAL_CALORIES : 0,
        handleDone,
    };
};
