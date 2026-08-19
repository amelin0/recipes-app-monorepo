import { useCallback, useState } from 'react';

import { router } from 'expo-router';

import { formatDayHeader } from '@/shared/helpers';
import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';

import type { DishAction, MacroData, MealDish } from './components';

export type MealKey = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface MealPlan {
    key: MealKey;
    time?: string;
    hasDetails: boolean;
    dishes: MealDish[];
    /**
     * Which trailing action each dish offers. The design ties it to where the
     * meal sits relative to now: eaten meals show a tick, the meal happening
     * now offers the cutlery action, later meals offer nothing (435:5993).
     */
    dishAction: DishAction;
    /** The meal happening now — the design outlines exactly one card. */
    current?: boolean;
}

const WATER_STEP_ML = 250;
const WATER_TARGET_ML = 2000;
const STEPS_TARGET = 15000;

export const useHomeScreen = () => {
    const { t } = useAppTranslation();

    // TODO: replace mocks with API data (nutrition + meal-plan domains).
    const [waterCurrent, setWaterCurrent] = useState(240);
    const [stepsCurrent] = useState(13000);

    const macros: MacroData[] = [
        { key: 'protein', current: 120, target: 250 },
        { key: 'fats', current: 4, target: 24 },
        { key: 'carbs', current: 150, target: 180 },
    ];

    // TODO: the plan for the day comes from the meal-plan endpoint; `dishAction`
    // and `current` follow from each meal's time against the clock.
    const meals: MealPlan[] = [
        {
            key: 'breakfast',
            time: '11:00',
            hasDetails: true,
            dishAction: 'eaten',
            dishes: [
                {
                    id: 'pancakes',
                    emoji: '🥞',
                    name: 'Панкейки',
                    calories: 320,
                    macros: [
                        { key: 'protein', value: 150 },
                        { key: 'fats', value: 120 },
                        { key: 'carbs', value: 23 },
                    ],
                },
            ],
        },
        {
            key: 'lunch',
            time: '14:00',
            hasDetails: true,
            current: true,
            dishAction: 'eat',
            dishes: [
                {
                    id: 'greek-salad',
                    emoji: '🥗',
                    name: 'Грецький салат',
                    calories: 350,
                    macros: [
                        { key: 'protein', value: 150 },
                        { key: 'fats', value: 0 },
                        { key: 'carbs', value: 30 },
                    ],
                },
                {
                    id: 'salmon',
                    emoji: '🐟',
                    name: 'Смажений лосось',
                    calories: 389,
                    macros: [
                        { key: 'protein', value: 150 },
                        { key: 'fats', value: 120 },
                        { key: 'carbs', value: 30 },
                    ],
                },
            ],
        },
        {
            key: 'dinner',
            time: '19:00',
            hasDetails: true,
            dishAction: 'none',
            dishes: [
                {
                    id: 'greek-salad-dinner',
                    emoji: '🥗',
                    name: 'Грецький салат',
                    calories: 350,
                    macros: [
                        { key: 'protein', value: 150 },
                        { key: 'fats', value: 0 },
                        { key: 'carbs', value: 30 },
                    ],
                },
                {
                    id: 'salmon-dinner',
                    emoji: '🐟',
                    name: 'Смажений лосось',
                    calories: 389,
                    macros: [
                        { key: 'protein', value: 150 },
                        { key: 'fats', value: 120 },
                        { key: 'carbs', value: 30 },
                    ],
                },
            ],
        },
        { key: 'snack', hasDetails: false, dishAction: 'none', dishes: [] },
    ];

    const comingSoon = useCallback(() => {
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    const handleAddWater = useCallback(() => {
        setWaterCurrent(prev => Math.min(prev + WATER_STEP_ML, WATER_TARGET_ML));
    }, []);

    return {
        initials: 'ОК',
        notificationsCount: 4,
        dateLabel: formatDayHeader(new Date()),
        calories: { current: 1000, target: 1850 },
        macros,
        meals,
        water: { current: waterCurrent, target: WATER_TARGET_ML },
        steps: { current: stepsCurrent, target: STEPS_TARGET },
        handleAvatarPress: () => router.push('/(app)/profile'),
        handleNotificationsPress: comingSoon,
        handleGoalPress: () => router.push('/(app)/goal-setup'),
        handleMealPress: (_meal: MealKey) => comingSoon(),
        handleAddMeal: (_meal: MealKey) => comingSoon(),
        handleDishAction: (_meal: MealKey, _dishId: string) => comingSoon(),
        handleWaterPress: comingSoon,
        handleAddWater,
        handleStepsPress: comingSoon,
        handleAddSteps: comingSoon,
    };
};
