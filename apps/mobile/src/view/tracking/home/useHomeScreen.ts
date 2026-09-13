import { useCallback, useMemo } from 'react';

import { router } from 'expo-router';

import type { MealSlot, PlanDay } from '@/data';
import { formatDayHeader, toIsoDay } from '@/shared/helpers';
import { ToastService } from '@/shared/services';
import type { DishAction, MealDish } from '@/shared/ui/widgets';
import { useAppTranslation } from '@/shared/utils/translations';
import { useUnreadCount } from '@/state/domains/notification';
import { useGetDay, useLogMeal, useLogWater, useDeleteMeal } from '@/state/domains/nutrition';
import { useGetPlan } from '@/state/domains/meal-plan';
import { useGetProfile, useGetReminders } from '@/state/domains/user';

import type { MacroData } from './components';
import { DEFAULT_SLOT_TIME, MEAL_SLOTS, SLOT_EMOJI, WATER_STEP_ML } from './home.constants';

export type MealKey = MealSlot;

interface MealPlanCard {
    key: MealKey;
    time?: string;
    hasDetails: boolean;
    dishes: MealDish[];
    dishAction: DishAction;
    current?: boolean;
    /** Meal-entry ids for dishes already eaten — what un-marking deletes. */
    eatenEntryIds: Record<string, string>;
}

/**
 * Prefix for a dish that exists only in the journal — eaten, but never
 * planned. Keeps its id from colliding with a plan item's.
 */
const LOGGED_PREFIX = 'logged:';

const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours ?? 0) * 60 + (minutes ?? 0);
};

/**
 * The meal happening now is the most recent one whose time has passed — the
 * design outlines exactly one card, and «nearest upcoming» would leave the
 * evening with none outlined all afternoon.
 *
 * Chosen by time, not by position: the slots render breakfast-lunch-dinner-
 * snack, but the snack sits at 11:00, so «last in the list that has passed»
 * would outline it all evening.
 */
const resolveCurrentSlot = (times: Record<MealSlot, string>, now: Date): MealSlot | null => {
    const minutesNow = now.getHours() * 60 + now.getMinutes();

    return MEAL_SLOTS.reduce<MealSlot | null>((current, slot) => {
        const at = toMinutes(times[slot]);
        if (at > minutesNow) return current;
        return current === null || at > toMinutes(times[current]) ? slot : current;
    }, null);
};

export const useHomeScreen = () => {
    const { t } = useAppTranslation(['tracking', 'common']);

    // The device's own calendar day: a meal eaten at 01:00 belongs to the
    // night before for the person eating it.
    const today = useMemo(() => toIsoDay(), []);

    const { data: day, isLoading, isError, refetch } = useGetDay(today);
    // Плану в денному зрізі поки немає — стенд віддає день без нього, тож
    // «Раціон на сьогодні» читаємо з ендпоінта плану окремим запитом.
    const { data: planDays } = useGetPlan(today, today);
    const { data: profile } = useGetProfile();
    const { data: reminders } = useGetReminders();
    const { data: unread } = useUnreadCount();

    const logMeal = useLogMeal();
    const deleteMeal = useDeleteMeal();
    const logWater = useLogWater();

    const slotTimes = useMemo(() => {
        const times = { ...DEFAULT_SLOT_TIME };
        reminders?.forEach(reminder => {
            if (reminder.type === 'weigh_in' || !reminder.time) return;
            // Дизайн пише годину без нуля — «8:00», не «08:00».
            times[reminder.type] = reminder.time.replace(/^0/, '');
        });
        return times;
    }, [reminders]);

    const currentSlot = useMemo(() => resolveCurrentSlot(slotTimes, new Date()), [slotTimes]);

    const planDay: PlanDay | undefined = planDays?.[0];

    const meals: MealPlanCard[] = useMemo(
        () =>
            MEAL_SLOTS.map(slot => {
                const items = planDay?.slots.find(entry => entry.slot === slot)?.items ?? [];
                const entries = day?.meals.filter(meal => meal.slot === slot) ?? [];

                // Заплановану страву вважаємо зʼїденою, якщо в журналі дня є
                // запис із тим самим рецептом і слотом — саме так сервер
                // звʼязує позначку з кільцем калорій. Кожен запис закриває
                // рівно одну позицію плану: дві однакові страви в слоті — це
                // дві позначки, а не одна на двох.
                const eatenEntryIds: Record<string, string> = {};
                const matched = new Set<string>();
                items.forEach(item => {
                    const entry = entries.find(meal => meal.recipeId === item.recipe.id && !matched.has(meal.id));
                    if (!entry) return;
                    matched.add(entry.id);
                    eatenEntryIds[item.id] = entry.id;
                });

                // Записи, яким не знайшлось позиції плану, — зʼїдене поза
                // планом: страва з рецепта, довільна порція. Без них кільце
                // рахує калорії, яких на екрані ніде немає, і прибрати
                // помилковий запис нічим.
                const unplanned = entries.filter(entry => !matched.has(entry.id));
                unplanned.forEach(entry => {
                    eatenEntryIds[`${LOGGED_PREFIX}${entry.id}`] = entry.id;
                });

                const dishes: MealDish[] = [
                    ...items.map<MealDish>(item => ({
                        id: item.id,
                        emoji: SLOT_EMOJI[slot],
                        photoUrl: item.recipe.photoUrl,
                        name: item.recipe.title,
                        calories: Math.round(item.recipe.perServing.calories),
                        macros: [
                            { key: 'protein', value: Math.round(item.recipe.perServing.proteinG) },
                            { key: 'fats', value: Math.round(item.recipe.perServing.fatsG) },
                            { key: 'carbs', value: Math.round(item.recipe.perServing.carbsG) },
                        ],
                    })),
                    ...unplanned.map<MealDish>(entry => ({
                        id: `${LOGGED_PREFIX}${entry.id}`,
                        emoji: SLOT_EMOJI[slot],
                        photoUrl: null,
                        name: entry.dishName,
                        calories: Math.round(entry.calories),
                        macros: [
                            { key: 'protein', value: Math.round(entry.proteinG) },
                            { key: 'fats', value: Math.round(entry.fatsG) },
                            { key: 'carbs', value: Math.round(entry.carbsG) },
                        ],
                    })),
                ];

                return {
                    key: slot,
                    time: slotTimes[slot],
                    hasDetails: items.length > 0,
                    dishAction: dishes.length === 0 ? 'none' : 'eat',
                    current: slot === currentSlot,
                    eatenEntryIds,
                    dishes,
                };
            }),
        [currentSlot, day, planDay, slotTimes],
    );

    const macros: MacroData[] = useMemo(
        () => [
            {
                key: 'protein',
                current: Math.round(day?.consumed.proteinG ?? 0),
                target: day?.goal?.dailyProteinG ?? 0,
            },
            { key: 'fats', current: Math.round(day?.consumed.fatsG ?? 0), target: day?.goal?.dailyFatsG ?? 0 },
            { key: 'carbs', current: Math.round(day?.consumed.carbsG ?? 0), target: day?.goal?.dailyCarbsG ?? 0 },
        ],
        [day],
    );

    const comingSoon = useCallback(() => {
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    const handleAddWater = useCallback(() => {
        if (logWater.isPending) return;
        logWater.mutate(
            { date: today, amountMl: WATER_STEP_ML },
            { onError: () => ToastService.error(t('common:states.error')) },
        );
    }, [logWater, t, today]);

    /**
     * The cutlery button. Logging the dish is what marks it — the mark and
     * the calorie ring read the same log, so there is no separate «eaten»
     * flag that could disagree with the ring.
     */
    const handleDishAction = useCallback(
        (slot: MealKey, dishId: string) => {
            if (logMeal.isPending || deleteMeal.isPending) return;

            const card = meals.find(meal => meal.key === slot);
            const eatenEntryId = card?.eatenEntryIds[dishId];

            if (eatenEntryId) {
                deleteMeal.mutate(
                    { date: today, id: eatenEntryId },
                    { onError: () => ToastService.error(t('common:states.error')) },
                );
                return;
            }

            const item = planDay?.slots.find(entry => entry.slot === slot)?.items.find(entry => entry.id === dishId);
            // Незапланований запис завжди зʼїдений — «відмітити» його нема як,
            // тож сюди він не доходить.
            if (!item) return;

            logMeal.mutate(
                {
                    date: today,
                    slot,
                    recipeId: item.recipe.id,
                    dishName: item.recipe.title,
                    portions: 1,
                    // Кнопка фіксує порцію цілком; частку задає окремий екран
                    // порцій, який відкривається з деталей страви.
                    eatenFraction: 1,
                    perPortion: {
                        calories: item.recipe.perServing.calories,
                        proteinG: item.recipe.perServing.proteinG,
                        fatsG: item.recipe.perServing.fatsG,
                        carbsG: item.recipe.perServing.carbsG,
                        weightG: item.recipe.perServing.weightG ?? 100,
                    },
                },
                { onError: () => ToastService.error(t('common:states.error')) },
            );
        },
        [deleteMeal, logMeal, meals, planDay, t, today],
    );

    return {
        isLoading,
        isError,
        handleRetry: refetch,
        initials: profile?.initials || (profile?.email?.charAt(0).toUpperCase() ?? ''),
        notificationsCount: unread?.count ?? 0,
        dateLabel: formatDayHeader(new Date()),
        calories: {
            current: Math.round(day?.consumed.calories ?? 0),
            target: day?.goal?.dailyCalories ?? 0,
        },
        macros,
        meals,
        /** Кожна страва несе свій стан: запланована й ще не зʼїдена — «eat»,
            зʼїдена (запланована чи ні) — «eaten». */
        resolveDishAction: (slot: MealKey, dishId: string): DishAction =>
            meals.find(meal => meal.key === slot)?.eatenEntryIds[dishId] ? 'eaten' : 'eat',
        water: { current: day?.consumed.waterMl ?? 0, target: day?.goal?.dailyWaterMl ?? 0 },
        steps: { current: day?.steps ?? 0, target: day?.stepsTarget ?? 0 },
        handleAvatarPress: () => router.push('/(app)/profile'),
        handleNotificationsPress: () => router.push('/(app)/notifications'),
        handleGoalPress: () => router.push('/(app)/goal-setup'),
        handleMealPress: (_meal: MealKey) => comingSoon(),
        handleAddMeal: (meal: MealKey) => router.push({ pathname: '/(app)/add-dish', params: { slot: meal } }),
        handleDishAction,
        handleWaterPress: comingSoon,
        handleAddWater,
        handleStepsPress: comingSoon,
        // Кроки — денний підсумок: той самий шит, що й на прогресі, лише
        // повертає він на головну, звідки його відкрили.
        handleAddSteps: () => router.push({ pathname: '/(app)/metric-add', params: { metric: 'steps', from: 'home' } }),
    };
};
