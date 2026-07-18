import { useCallback, useState } from 'react';

import { router } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';

import { formatDayHeader } from '@/shared/helpers';
import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';

import type { MacroData } from './components';

export type MealKey = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const WATER_STEP_ML = 250;
const WATER_TARGET_ML = 2000;

export const useHomeScreen = () => {
    const { t } = useAppTranslation();
    const { theme } = useUnistyles();

    // TODO: replace mocks with API data (nutrition + meal-plan domains).
    const [waterCurrent, setWaterCurrent] = useState(0);

    const macros: MacroData[] = [
        { key: 'protein', current: 120, target: 250, barColor: theme.colors.semantic.positive },
        { key: 'fats', current: 4, target: 24, barColor: theme.colors.semantic.orange },
        { key: 'carbs', current: 150, target: 180, barColor: theme.colors.semantic.negative },
    ];

    const meals: { key: MealKey; time?: string; hasDetails: boolean }[] = [
        { key: 'breakfast', time: '11:00', hasDetails: true },
        { key: 'lunch', time: '14:00', hasDetails: true },
        { key: 'dinner', time: '19:00', hasDetails: true },
        { key: 'snack', hasDetails: false },
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
        handleAvatarPress: comingSoon,
        handleNotificationsPress: comingSoon,
        handleGoalPress: () => router.push('/(app)/goal-setup'),
        handleMealPress: (_meal: MealKey) => comingSoon(),
        handleAddMeal: (_meal: MealKey) => comingSoon(),
        handleAddWater,
    };
};
