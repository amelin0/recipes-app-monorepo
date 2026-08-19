import { useCallback, useMemo, useState } from 'react';

import { useLocalSearchParams } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';

import { formatThousands } from '@/shared/helpers';
import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';

import type { BarGroup, LinePoint, MetricHeadlineValue, MetricStatBox } from '../components';
import {
    MOCK_CALORIES,
    MOCK_CALORIES_DETAIL,
    MOCK_HEIGHT_DETAIL,
    MOCK_STEPS,
    MOCK_STEPS_DETAIL,
    MOCK_WAIST_DETAIL,
    MOCK_WATER,
    MOCK_WATER_DETAIL,
    MOCK_WEIGHT_DETAIL,
    type MetricKey,
    type MockMetricRecord,
} from '../progress.constants';

/** Metrics logged once in a while, against no daily goal. */
const READING_METRICS: MetricKey[] = ['weight', 'waist', 'height'];
/** Metrics whose top bar offers a way to add a reading. */
const ADDABLE_METRICS: MetricKey[] = ['weight', 'steps', 'waist', 'height'];

export const useMetricDetailScreen = () => {
    const { t } = useAppTranslation(['progress', 'common']);
    const { theme } = useUnistyles();
    const { metric = 'weight' } = useLocalSearchParams<{ metric?: MetricKey }>();

    const [nutrientTab, setNutrientTab] = useState('calories');

    const comingSoon = useCallback(() => {
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    const format = formatThousands;
    const isReading = READING_METRICS.includes(metric);

    const units = useMemo(
        () => ({
            weight: t('progress:units.kg'),
            calories: t('progress:units.kcal'),
            water: t('progress:units.ml'),
            steps: t('progress:units.steps'),
            waist: t('progress:units.cm'),
            height: t('progress:units.cm'),
        }),
        [t],
    );
    const unit = units[metric];

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

    const headline: MetricHeadlineValue[] = useMemo(() => {
        const goalCard = (label: string, value: string, goalUnit: string) => ({
            label,
            value,
            unit: goalUnit,
            valueColor: theme.colors.semantic.ocean,
        });

        switch (metric) {
            case 'weight':
                return [
                    {
                        label: t('progress:labels.current-f'),
                        value: MOCK_WEIGHT_DETAIL.currentKg.toFixed(1),
                        unit: units.weight,
                        note: t('progress:detail.to-goal', {
                            value: (MOCK_WEIGHT_DETAIL.goalKg - MOCK_WEIGHT_DETAIL.currentKg).toFixed(1),
                        }),
                        noteColor: theme.colors.semantic.positive,
                    },
                    goalCard(t('progress:labels.goal'), String(MOCK_WEIGHT_DETAIL.goalKg), units.weight),
                ];
            case 'calories':
                return [
                    {
                        label: t('progress:labels.today'),
                        value: format(MOCK_CALORIES_DETAIL.todayKcal),
                        unit: units.calories,
                        note: t('progress:detail.to-goal-plain', {
                            value: format(MOCK_CALORIES_DETAIL.goalKcal - MOCK_CALORIES_DETAIL.todayKcal),
                        }),
                        noteColor: theme.colors.semantic.positive,
                    },
                    goalCard(t('progress:labels.goal'), format(MOCK_CALORIES_DETAIL.goalKcal), units.calories),
                ];
            case 'water':
                return [
                    { label: t('progress:labels.today'), value: format(MOCK_WATER_DETAIL.todayMl), unit: units.water },
                    goalCard(
                        t('progress:labels.goal'),
                        format(MOCK_WATER_DETAIL.goalMl),
                        t('progress:units.ml-per-day'),
                    ),
                ];
            case 'steps':
                return [
                    {
                        label: t('progress:labels.today'),
                        value: format(MOCK_STEPS_DETAIL.todaySteps),
                        unit: units.steps,
                    },
                    goalCard(
                        t('progress:labels.goal'),
                        format(MOCK_STEPS_DETAIL.goalSteps),
                        t('progress:units.steps-per-day'),
                    ),
                ];
            case 'waist':
                return [
                    {
                        label: t('progress:waist.current'),
                        value: String(MOCK_WAIST_DETAIL.currentCm),
                        unit: units.waist,
                    },
                    {
                        label: t('progress:waist.recommended'),
                        value: `<${MOCK_WAIST_DETAIL.recommendedMaxCm}`,
                        unit: units.waist,
                        valueColor: theme.colors.semantic.ocean,
                    },
                ];
            default:
                return [
                    {
                        label: t('progress:height.current'),
                        value: MOCK_HEIGHT_DETAIL.currentCm.toFixed(1),
                        unit: units.height,
                    },
                ];
        }
    }, [format, metric, t, theme, units]);

    const statRows: MetricStatBox[][] = useMemo(() => {
        const range = (min: string, average: string, max: string, rangeUnit: string, averageLabel: string) => [
            [
                { key: 'min', label: t('progress:labels.min'), value: min, unit: rangeUnit },
                { key: 'avg', label: averageLabel, value: average, unit: rangeUnit },
                { key: 'max', label: t('progress:labels.max'), value: max, unit: rangeUnit },
            ],
        ];

        switch (metric) {
            case 'weight':
                return range(
                    String(MOCK_WEIGHT_DETAIL.minKg),
                    MOCK_WEIGHT_DETAIL.averageKg.toFixed(1),
                    MOCK_WEIGHT_DETAIL.maxKg.toFixed(1),
                    units.weight,
                    t('progress:labels.average-f'),
                );
            case 'water':
                return range(
                    format(MOCK_WATER_DETAIL.minMl),
                    format(MOCK_WATER_DETAIL.averageMl),
                    format(MOCK_WATER_DETAIL.maxMl),
                    t('progress:units.ml-per-day'),
                    t('progress:labels.average-n'),
                );
            case 'steps':
                return range(
                    format(MOCK_STEPS_DETAIL.minSteps),
                    format(MOCK_STEPS_DETAIL.averageSteps),
                    format(MOCK_STEPS_DETAIL.maxSteps),
                    t('progress:units.steps-per-day'),
                    t('progress:labels.average-f'),
                );
            case 'calories': {
                const ofDays = t('progress:detail.of-days', { value: MOCK_CALORIES_DETAIL.daysTotal });
                return [
                    [
                        {
                            key: 'min-norm',
                            label: t('progress:detail.min-norm'),
                            value: `<${format(MOCK_CALORIES_DETAIL.minNormKcal)}`,
                            unit: t('progress:units.kcal-per-day'),
                        },
                        {
                            key: 'max-norm',
                            label: t('progress:detail.max-norm'),
                            value: `>${format(MOCK_CALORIES_DETAIL.maxNormKcal)}`,
                            unit: t('progress:units.kcal-per-day'),
                        },
                    ],
                    [
                        {
                            key: 'under',
                            label: t('progress:legend.under'),
                            value: String(MOCK_CALORIES_DETAIL.daysUnder),
                            unit: ofDays,
                        },
                        {
                            key: 'within',
                            label: t('progress:detail.within-norm'),
                            value: String(MOCK_CALORIES_DETAIL.daysWithin),
                            unit: ofDays,
                        },
                        {
                            key: 'outside',
                            label: t('progress:detail.outside-norm'),
                            value: String(MOCK_CALORIES_DETAIL.daysOver),
                            unit: ofDays,
                        },
                    ],
                ];
            }
            default:
                // Waist and height carry no period summary in the design.
                return [];
        }
    }, [format, metric, t, units]);

    const linePoints: LinePoint[] = useMemo(() => {
        if (metric === 'weight') return MOCK_WEIGHT_DETAIL.points;
        if (metric === 'height') return MOCK_HEIGHT_DETAIL.points;
        // A waist reading over the recommended bound is marked as such.
        return MOCK_WAIST_DETAIL.points.map(point => ({
            ...point,
            color:
                point.value > MOCK_WAIST_DETAIL.recommendedMaxCm
                    ? theme.colors.semantic.negative
                    : theme.colors.semantic.positive,
        }));
    }, [metric, theme]);

    const bars = useMemo(() => {
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

    const records: MockMetricRecord[] = {
        weight: MOCK_WEIGHT_DETAIL.records,
        calories: MOCK_CALORIES_DETAIL.records,
        water: MOCK_WATER_DETAIL.records,
        steps: MOCK_STEPS_DETAIL.records,
        waist: MOCK_WAIST_DETAIL.records,
        height: MOCK_HEIGHT_DETAIL.records,
    }[metric];

    const goalValue = {
        weight: 0,
        calories: MOCK_CALORIES_DETAIL.goalKcal,
        water: MOCK_WATER_DETAIL.goalMl,
        steps: MOCK_STEPS_DETAIL.goalSteps,
        waist: 0,
        height: 0,
    }[metric];

    return {
        metric,
        isReading,
        canAdd: ADDABLE_METRICS.includes(metric),
        /** The design gives these two a period label; weight and height differ. */
        chartTitle:
            metric === 'weight'
                ? t('progress:detail.dynamics')
                : t('progress:detail.dynamics-days', { value: metric === 'height' ? 30 : 28 }),
        headline,
        // Waist reads as two statements rather than a comparison (1024:31123).
        headlineDirection: metric === 'waist' ? ('column' as const) : ('row' as const),
        statRows,
        linePoints,
        lineAxis:
            metric === 'weight'
                ? MOCK_WEIGHT_DETAIL.axis
                : metric === 'height'
                  ? MOCK_HEIGHT_DETAIL.axis
                  : MOCK_WAIST_DETAIL.axis,
        bars,
        records,
        goalValue,
        unit,
        nutrientTab,
        setNutrientTab,
        format,
        handleAdd: comingSoon,
        handleEditGoal: comingSoon,
        handleReminders: comingSoon,
    };
};
