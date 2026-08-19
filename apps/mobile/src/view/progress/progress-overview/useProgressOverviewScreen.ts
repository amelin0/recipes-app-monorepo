import { useCallback, useState } from 'react';

import { router } from 'expo-router';

import { useUnistyles } from 'react-native-unistyles';

import { formatThousands } from '@/shared/helpers';
import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';

import {
    MOCK_CALORIES,
    MOCK_HEIGHT,
    MOCK_STEPS,
    MOCK_WAIST,
    MOCK_WATER,
    MOCK_WEIGHT,
    type MetricKey,
    type ReadingMetricKey,
} from '../progress.constants';
import type { BarGroup } from '../components';

export type NutrientTab = 'calories' | 'protein' | 'fats' | 'carbs';

export const useProgressOverviewScreen = () => {
    const { t } = useAppTranslation(['progress', 'common']);
    const { theme } = useUnistyles();

    const [nutrientTab, setNutrientTab] = useState<NutrientTab>('calories');

    const comingSoon = useCallback(() => {
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    /**
     * Planned sits next to actual, and actual is coloured by how it landed:
     * on target, short of it, or over (805:16732).
     */
    const calorieGroups: BarGroup[] = MOCK_CALORIES.days.map(day => ({
        label: day.label,
        bars: [
            { key: 'planned', value: day.planned, color: theme.colors.semantic.ocean },
            {
                key: 'actual',
                value: day.actual,
                color:
                    day.actual > MOCK_CALORIES.goalPerDay
                        ? theme.colors.semantic.negative
                        : day.actual < day.planned
                          ? theme.colors.semantic.orange
                          : theme.colors.branding.accent,
            },
        ],
    }));

    const waterGroups: BarGroup[] = MOCK_WATER.days.map(day => ({
        label: day.label,
        bars: [
            {
                key: 'value',
                value: day.value,
                color: day.value >= MOCK_WATER.goalMl ? theme.colors.semantic.ocean : theme.colors.semantic.negative,
            },
        ],
    }));

    const stepGroups: BarGroup[] = MOCK_STEPS.days.map(day => ({
        label: day.label,
        bars: [{ key: 'value', value: day.value, color: theme.colors.semantic.orange }],
    }));

    return {
        weight: MOCK_WEIGHT,
        calories: { ...MOCK_CALORIES, groups: calorieGroups },
        water: { ...MOCK_WATER, groups: waterGroups },
        steps: { ...MOCK_STEPS, groups: stepGroups },
        waist: MOCK_WAIST,
        height: MOCK_HEIGHT,
        nutrientTab,
        setNutrientTab: (key: string) => setNutrientTab(key as NutrientTab),
        format: formatThousands,
        handleMetricPress: (metric: MetricKey) => router.push({ pathname: '/(app)/metric-detail', params: { metric } }),
        // TODO: goal editing still has no design.
        handleEditGoal: comingSoon,
        handleReminders: () => router.push('/(app)/weigh-in-reminder'),
        handleAdd: (metric: ReadingMetricKey) => router.push({ pathname: '/(app)/metric-add', params: { metric } }),
        // Steps come from the day, not from a reading sheet — no design yet.
        handleAddSteps: comingSoon,
    };
};
