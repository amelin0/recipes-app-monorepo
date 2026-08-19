import { useCallback, useMemo, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';

import { formatThousands } from '@/shared/helpers';
import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';

import type { BarGroup } from '../components';
import {
    MOCK_CALORIES,
    MOCK_CALORIES_DETAIL,
    MOCK_STEPS,
    MOCK_STEPS_DETAIL,
    MOCK_WATER,
    MOCK_WATER_DETAIL,
    MOCK_WEIGHT_DETAIL,
    type MetricKey,
} from '../progress.constants';

export const useMetricDetailScreen = () => {
    const { t } = useAppTranslation(['progress', 'common']);
    const { theme } = useUnistyles();
    const { metric = 'weight' } = useLocalSearchParams<{ metric?: MetricKey }>();

    const [nutrientTab, setNutrientTab] = useState('calories');

    const comingSoon = useCallback(() => {
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    /** Consumed against the goal, coloured by whether the day landed on it. */
    const goalBars = useCallback(
        (days: { label: string; value: number }[], goal: number): BarGroup[] =>
            days.map(day => ({
                label: day.label,
                bars: [
                    {
                        key: 'value',
                        value: day.value,
                        color: day.value >= goal ? theme.colors.branding.accent : theme.colors.semantic.orange,
                    },
                ],
            })),
        [theme],
    );

    const chart = useMemo(() => {
        if (metric === 'calories') {
            return {
                groups: MOCK_CALORIES.days.map(day => ({
                    label: day.label,
                    bars: [
                        { key: 'planned', value: day.planned, color: theme.colors.semantic.ocean },
                        {
                            key: 'actual',
                            value: day.actual,
                            color:
                                day.actual > MOCK_CALORIES_DETAIL.maxNormKcal
                                    ? theme.colors.semantic.negative
                                    : day.actual < MOCK_CALORIES_DETAIL.minNormKcal
                                      ? theme.colors.semantic.orange
                                      : theme.colors.branding.accent,
                        },
                    ],
                })),
                axis: MOCK_CALORIES.axis,
                max: MOCK_CALORIES.max,
            };
        }
        if (metric === 'water') {
            return {
                groups: goalBars(MOCK_WATER.days, MOCK_WATER_DETAIL.goalMl),
                axis: MOCK_WATER.axis,
                max: MOCK_WATER.max,
            };
        }
        return {
            groups: goalBars(MOCK_STEPS.days, MOCK_STEPS_DETAIL.goalSteps),
            axis: MOCK_STEPS.axis,
            max: MOCK_STEPS.max,
        };
    }, [goalBars, metric, theme]);

    return {
        metric,
        weight: MOCK_WEIGHT_DETAIL,
        calories: MOCK_CALORIES_DETAIL,
        water: MOCK_WATER_DETAIL,
        steps: MOCK_STEPS_DETAIL,
        chart,
        nutrientTab,
        setNutrientTab,
        format: formatThousands,
        handleBack: () => router.back(),
        handleAdd: comingSoon,
        handleEditGoal: comingSoon,
        handleReminders: comingSoon,
    };
};
