import { useCallback, useRef, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';
import { buildPlanDish, pickedPlanId, resolvePlanTarget } from '@/state/domains/meal-plan';

import { MOCK_MEAL_DETAIL } from '../recipe.constants';

export type MealDetailsTab = 'ingredients' | 'method';

export const useMealDetailsScreen = () => {
    const { t } = useAppTranslation(['recipes', 'common']);
    // TODO: fetch by id (GET /recipes/:id) once the API ships.
    const params = useLocalSearchParams<{ id?: string; mode?: string; day?: string; meal?: string }>();
    const meal = MOCK_MEAL_DETAIL;

    // Відкрито з пікера — CTA додає страву до прийому (984:58839).
    const isPlanMode = params.mode === 'plan';
    const planWeek = useStore(state => state.planWeek);
    const addPlanDishes = useStore(state => state.addPlanDishes);
    const { day, meal: mealKey } = resolvePlanTarget(planWeek, params.day, params.meal);

    // Інгредієнти — перша вкладка й та, з якої екран відкривається (984:58839).
    const [activeTab, setActiveTab] = useState<MealDetailsTab>('ingredients');
    const [isFavorite, setIsFavorite] = useState(false);

    const showComingSoon = useCallback(() => {
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    // Guard: навігація асинхронна — подвійний тап не має дублювати страву.
    const addedToPlan = useRef(false);
    const handleAddToPlan = useCallback(() => {
        if (addedToPlan.current) return;
        addedToPlan.current = true;
        addPlanDishes(day, mealKey, [
            buildPlanDish({
                // id рядка пікера — його тік у списку підсвітиться (984:58839).
                id: pickedPlanId(typeof params.id === 'string' ? params.id : meal.id),
                emoji: meal.emoji,
                name: meal.title,
                calories: meal.kcal,
                protein: meal.protein,
                fats: meal.fats,
                carbs: meal.carbs,
            }),
        ]);
        if (router.canGoBack()) router.back();
        else router.replace('/(app)/(tabs)/meal-plan');
    }, [addPlanDishes, day, mealKey, meal, params.id]);

    return {
        meal,
        isPlanMode,
        activeTab,
        setActiveTab: (key: string) => setActiveTab(key as MealDetailsTab),
        isFavorite,
        // TODO: PUT /recipes/:id/favorite once the API ships.
        handleToggleFavorite: () => setIsFavorite(prev => !prev),
        handleEdit: showComingSoon,
        handleShare: showComingSoon,
        handleAddToPlan,
        // Logging a meal starts with how much of it was eaten.
        handleLogMeal: () => router.push('/(app)/meal-portions'),
    };
};
