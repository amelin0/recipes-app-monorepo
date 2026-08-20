import { useCallback, useMemo, useState } from 'react';

import { router } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';

import { MOCK_PLAN_WEEK, MOCK_PLAN_WEEK_RANGE, type PlanDay, type PlanMealKey } from '../meal-plan.constants';

export const useMealPlanScreen = () => {
    const { t } = useAppTranslation(['meal-plan', 'common']);

    const [selectedDayKey, setSelectedDayKey] = useState(MOCK_PLAN_WEEK[0]?.key ?? 'mon');
    // Local copy so deleting dishes and basket toggles survive day switching.
    const [week, setWeek] = useState<PlanDay[]>(MOCK_PLAN_WEEK);
    // Keyed per day — mock dish ids repeat across days.
    const [inBasket, setInBasket] = useState<Record<string, boolean>>({ 'mon:pancakes': true });

    const day = useMemo(() => week.find(item => item.key === selectedDayKey) ?? week[0], [selectedDayKey, week]);

    const hasDishes = (day?.meals ?? []).some(meal => meal.dishes.length > 0);

    const handleDeleteDish = useCallback(
        (mealKey: PlanMealKey, dishId: string) => {
            // TODO: DELETE /meal-plan/days/:day/dishes/:id once the API ships.
            setWeek(prev =>
                prev.map(item =>
                    item.key === selectedDayKey
                        ? {
                              ...item,
                              meals: item.meals.map(meal =>
                                  meal.key === mealKey
                                      ? { ...meal, dishes: meal.dishes.filter(dish => dish.id !== dishId) }
                                      : meal,
                              ),
                          }
                        : item,
                ),
            );
            ToastService.success(t('meal-plan:screen.dish-deleted'));
        },
        [selectedDayKey, t],
    );

    const handleToggleBasket = useCallback(
        (dishId: string) => {
            // TODO: POST /shopping-list/items from the dish once the API ships.
            const key = `${selectedDayKey}:${dishId}`;
            setInBasket(prev => ({ ...prev, [key]: !prev[key] }));
        },
        [selectedDayKey],
    );

    const handleAddAllToList = useCallback(() => {
        // TODO: POST /shopping-list/items for the whole day once the API ships.
        setInBasket(prev => {
            const next = { ...prev };
            day?.meals.forEach(meal => meal.dishes.forEach(dish => (next[`${selectedDayKey}:${dish.id}`] = true)));
            return next;
        });
        ToastService.success(t('meal-plan:screen.added-to-list'));
    }, [day, selectedDayKey, t]);

    return {
        week,
        weekRange: MOCK_PLAN_WEEK_RANGE,
        day,
        selectedDayKey,
        setSelectedDayKey,
        hasDishes,
        resolveDishAction: (dishId: string) =>
            inBasket[`${selectedDayKey}:${dishId}`] ? ('basket-added' as const) : ('basket' as const),
        /** «Перекус» has no time and no details entry in the design (961:59371). */
        mealHasDetails: (mealKey: PlanMealKey) => mealKey !== 'snack',
        handleChangeGoal: () => router.push('/(app)/goal-setup'),
        // TODO: route to the meal editor / dish picker once they are designed.
        handleMealPress: () => ToastService.info(t('common:states.coming-soon')),
        handleAddDish: () => ToastService.info(t('common:states.coming-soon')),
        handleToggleBasket,
        handleDeleteDish,
        handleAddAllToList,
        handleCopyPlan: () => router.push('/(app)/copy-plan'),
    };
};
