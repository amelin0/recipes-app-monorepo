import { router, useLocalSearchParams } from 'expo-router';

import { useStore } from '@/state';
import { buildPlanDish, resolvePlanTarget } from '@/state/domains/meal-plan';

import { MOCK_CREATED_DISH } from '../recipe.constants';

export const useDishCreatedScreen = () => {
    // Флоу створення передасть прийом, з якого його запустили (628:27032).
    const params = useLocalSearchParams<{ day?: string; meal?: string }>();
    const dish = MOCK_CREATED_DISH;

    const planWeek = useStore(state => state.planWeek);
    const addPlanDishes = useStore(state => state.addPlanDishes);
    const { day, meal } = resolvePlanTarget(planWeek, params.day, params.meal);

    // Створення без план-контексту веде до страви, а не до раціону (628:25123).
    const hasPlanContext = typeof params.day === 'string' && params.day.length > 0;

    return {
        dish,
        hasPlanContext,
        // Той самий шлях, що й «Відмітити прийом їжі» в деталях страви.
        handleLogMeal: () => router.push('/(app)/meal-portions'),
        handleAddToRation: () => {
            addPlanDishes(day, meal, [
                buildPlanDish({
                    id: `${dish.id}-${Date.now()}`,
                    emoji: dish.emoji,
                    name: dish.title,
                    calories: dish.kcal,
                    protein: dish.protein,
                    fats: dish.fats,
                    carbs: dish.carbs,
                }),
            ]);
            router.replace('/(app)/(tabs)/meal-plan');
        },
        handleGoHome: () => router.replace('/(app)/(tabs)/home'),
    };
};
