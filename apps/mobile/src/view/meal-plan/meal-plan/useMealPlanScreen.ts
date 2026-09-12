import { useCallback, useMemo } from 'react';

import { router } from 'expo-router';

import { shiftIsoDay, toIsoDay } from '@/shared/helpers';
import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';
import { useGetPlan, useRemovePlanItem, type PlanMealKey } from '@/state/domains/meal-plan';
import { useTogglePlanImport } from '@/state/domains/shopping-list';
import { useGetReminders } from '@/state/domains/user';

import { toPlanDay } from './plan.helpers';

/**
 * How far forward the day strip reaches — two weeks, as the owner asked.
 * Backwards it stops at today: the plan is something you make, and scrolling
 * into last week offers to plan a day that is already over.
 */
const PLAN_DAYS_AHEAD = 13;

export const useMealPlanScreen = () => {
    const { t } = useAppTranslation(['meal-plan', 'common']);

    const selectedDayKey = useStore(state => state.selectedPlanDate);
    const setSelectedPlanDate = useStore(state => state.setSelectedPlanDate);

    const today = useMemo(() => toIsoDay(), []);
    const range = useMemo(() => ({ from: today, to: shiftIsoDay(today, PLAN_DAYS_AHEAD) }), [today]);

    const { data, isLoading, isError, refetch } = useGetPlan(range.from, range.to);
    const { data: reminders } = useGetReminders();
    const removeItem = useRemovePlanItem();
    const togglePlanImport = useTogglePlanImport();

    // Часи прийомів беремо з розкладу нагадувань — єдине місце, де застосунок
    // знає, коли людина їсть. «Перекус» у дизайні без часу (961:59371).
    const slotTimes = useMemo(() => {
        const times: Record<PlanMealKey, string | undefined> = {
            breakfast: undefined,
            lunch: undefined,
            dinner: undefined,
            snack: undefined,
        };
        reminders?.forEach(reminder => {
            if (reminder.type === 'weigh_in' || reminder.type === 'snack' || !reminder.time) return;
            times[reminder.type] = reminder.time.replace(/^0/, '');
        });
        return times;
    }, [reminders]);

    const week = useMemo(() => (data ?? []).map(day => toPlanDay(day, slotTimes)), [data, slotTimes]);

    // Обраний день міг випасти з вікна (застосунок пролежав до опівночі) —
    // тоді відкриваємо перший наявний, а не порожній екран.
    const day = useMemo(() => week.find(item => item.key === selectedDayKey) ?? week[0], [selectedDayKey, week]);

    const apiDay = useMemo(() => data?.find(item => item.date === day?.key), [data, day]);

    const hasDishes = (day?.meals ?? []).some(meal => meal.dishes.length > 0);

    const handleDeleteDish = useCallback(
        (_mealKey: PlanMealKey, itemId: string) => {
            if (!day) return;
            removeItem.mutate(
                { date: day.key, itemId },
                {
                    onSuccess: () => ToastService.success(t('meal-plan:screen.dish-deleted')),
                    onError: () => ToastService.error(t('common:states.error')),
                },
            );
        },
        [day, removeItem, t],
    );

    /**
     * «Додати до списку покупок» is a switch, not an action on the day.
     *
     * The list sums the plan on every read, so there is nothing to «add» —
     * a dish is either counted or the import is off. The button therefore
     * turns the import on and is disabled once it is, which is also what the
     * spec's FR-006 says (`handoff/mobile-ui-review.md` §1.3).
     */
    const importsIntoList = apiDay?.importsIntoShoppingList ?? false;

    const handleAddAllToList = useCallback(() => {
        if (importsIntoList || togglePlanImport.isPending) return;
        togglePlanImport.mutate(true, {
            onSuccess: () => ToastService.success(t('meal-plan:screen.added-to-list')),
            onError: () => ToastService.error(t('common:states.error')),
        });
    }, [importsIntoList, t, togglePlanImport]);

    return {
        week,
        day,
        selectedDayKey: day?.key ?? selectedDayKey,
        setSelectedDayKey: setSelectedPlanDate,
        isLoading,
        isError,
        handleRetry: refetch,
        hasDishes,
        /** Чи лишилось що додавати до списку покупок цього дня. */
        hasPendingForList: hasDishes && !importsIntoList,
        resolveDishAction: () => (importsIntoList ? ('basket-added' as const) : ('basket' as const)),
        /** «Перекус» has no time and no details entry in the design (961:59371). */
        mealHasDetails: (mealKey: PlanMealKey) => mealKey !== 'snack',
        handleChangeGoal: () => router.push('/(app)/goal-setup'),
        // TODO: route to the meal editor once it is designed.
        handleMealPress: () => ToastService.info(t('common:states.coming-soon')),
        handleAddDish: (mealKey: PlanMealKey) =>
            router.push({ pathname: '/(app)/add-dish', params: { day: day?.key ?? today, meal: mealKey } }),
        // Позначка «у списку» — стан дня, а не дія над стравою: тап по кошику
        // вмикає той самий імпорт, що й кнопка внизу.
        handleToggleBasket: (_dishId: string) => handleAddAllToList(),
        handleDeleteDish,
        handleAddAllToList,
        handleCopyPlan: () => router.push({ pathname: '/(app)/copy-plan', params: { day: day?.key ?? today } }),
    };
};
