import { useCallback, useMemo, useState } from 'react';

import { router } from 'expo-router';

import { useUnistyles } from 'react-native-unistyles';

import type { ProgressCard, ProgressMetric } from '@/data';
import { formatThousands, shiftIsoDay, toIsoDay } from '@/shared/helpers';
import { useAppTranslation } from '@/shared/utils/translations';
import { useGetPlan } from '@/state/domains/meal-plan';
import { useGetProgressMetrics } from '@/state/domains/progress';

import type { BarGroup } from '../components';
import {
    averageOf,
    barChartMax,
    buildAxis,
    buildBarAxis,
    pointLabel,
    recentPoints,
    toLinePoints,
} from '../progress.helpers';
import type { GoalMetricKey, MetricKey, ReadingMetricKey } from '../progress.constants';

export type NutrientTab = 'calories' | 'protein' | 'fats' | 'carbs';

/** The bar charts show a week, as the design does. */
const BAR_DAYS = 7;

export const useProgressOverviewScreen = () => {
    const { t } = useAppTranslation(['progress', 'common']);
    const { theme } = useUnistyles();

    const [nutrientTab, setNutrientTab] = useState<NutrientTab>('calories');

    const { data, isLoading, isError, refetch } = useGetProgressMetrics();

    // Заплановане на день не несе жоден прогресовий ендпоінт — це властивість
    // плану, тож беремо той самий тиждень із нього.
    const barRange = useMemo(() => {
        const to = toIsoDay();
        return { from: shiftIsoDay(to, -(BAR_DAYS - 1)), to };
    }, []);
    const { data: planDays } = useGetPlan(barRange.from, barRange.to);

    const cardOf = useCallback(
        (metric: ProgressMetric): ProgressCard | undefined => data?.find(card => card.metric === metric),
        [data],
    );

    /** A one-off metric card: first reading, latest, goal, and the line. */
    const lineMetric = useCallback(
        (metric: ProgressMetric) => {
            const card = cardOf(metric);
            const points = toLinePoints(card?.points ?? []);
            return {
                start: card?.initial ?? card?.current ?? 0,
                current: card?.current ?? 0,
                goal: card?.goal ?? null,
                recommendedMax: card?.recommendedMax ?? null,
                points,
                axis: buildAxis(
                    points.map(point => point.value),
                    [card?.goal ?? null],
                ),
            };
        },
        [cardOf],
    );

    const weight = useMemo(() => lineMetric('weight'), [lineMetric]);
    const waist = useMemo(() => lineMetric('waist'), [lineMetric]);
    const height = useMemo(() => lineMetric('height'), [lineMetric]);

    const nutrientCard = cardOf(nutrientTab);

    /**
     * Planned sits next to actual, and actual is coloured by how it landed —
     * the verdict comes from the server, so the chart and the day tiles in the
     * plan never disagree about what «over» means (805:16732).
     */
    const nutrients = useMemo(() => {
        const points = recentPoints(nutrientCard, BAR_DAYS);
        const goal = nutrientCard?.goal ?? null;

        const plannedOf = (date: string) => {
            const day = planDays?.find(entry => entry.date === date);
            if (!day) return 0;
            return nutrientTab === 'calories'
                ? day.planned.calories
                : nutrientTab === 'protein'
                  ? day.planned.proteinG
                  : nutrientTab === 'fats'
                    ? day.planned.fatsG
                    : day.planned.carbsG;
        };

        const groups: BarGroup[] = points.map(point => ({
            label: pointLabel(point.date),
            bars: [
                { key: 'planned', value: Math.round(plannedOf(point.date)), color: theme.colors.semantic.ocean },
                {
                    key: 'actual',
                    value: Math.round(point.value),
                    color:
                        point.outcome === 'over'
                            ? theme.colors.semantic.negative
                            : point.outcome === 'under'
                              ? theme.colors.semantic.orange
                              : theme.colors.branding.accent,
                },
            ],
        }));

        const max = barChartMax(
            groups.flatMap(group => group.bars.map(bar => bar.value)),
            goal,
        );

        return {
            averagePerDay: averageOf(points.map(point => point.value)),
            goalPerDay: goal ?? 0,
            groups,
            max,
            // Без роздільника тисяч: вісь вузька, і «3,000» переносилось би
            // на два рядки. Дизайн теж пише її без коми (805:16732).
            axis: buildBarAxis(max, value => String(value)),
        };
    }, [nutrientCard, nutrientTab, planDays, theme]);

    const water = useMemo(() => {
        const card = cardOf('water');
        const points = recentPoints(card, BAR_DAYS);
        const goal = card?.goal ?? 0;

        const groups: BarGroup[] = points.map(point => ({
            label: pointLabel(point.date),
            bars: [
                {
                    key: 'value',
                    value: Math.round(point.value),
                    color:
                        point.value >= goal && goal > 0 ? theme.colors.semantic.ocean : theme.colors.semantic.negative,
                },
            ],
        }));

        const max = barChartMax(
            points.map(point => point.value),
            goal,
        );

        return {
            averageMl: averageOf(points.map(point => point.value)),
            goalMl: goal,
            groups,
            max,
            axis: buildBarAxis(max, value => t('progress:water.axis-litres', { value: (value / 1000).toFixed(0) })),
        };
    }, [cardOf, t, theme]);

    const steps = useMemo(() => {
        const card = cardOf('steps');
        const points = recentPoints(card, BAR_DAYS);
        const goal = card?.goal ?? 0;

        const groups: BarGroup[] = points.map(point => ({
            label: pointLabel(point.date),
            bars: [{ key: 'value', value: Math.round(point.value), color: theme.colors.semantic.orange }],
        }));

        const max = barChartMax(
            points.map(point => point.value),
            goal,
        );

        return {
            averagePerDay: averageOf(points.map(point => point.value)),
            goalPerDay: goal,
            groups,
            max,
            axis: buildBarAxis(max, value => t('progress:steps.axis-thousands', { value: Math.round(value / 1000) })),
        };
    }, [cardOf, t, theme]);

    return {
        isLoading,
        isError,
        handleRetry: refetch,
        weight,
        calories: nutrients,
        water,
        steps,
        waist,
        height,
        nutrientTab,
        setNutrientTab: (key: string) => setNutrientTab(key as NutrientTab),
        format: formatThousands,
        handleMetricPress: (metric: MetricKey) => router.push({ pathname: '/(app)/metric-detail', params: { metric } }),
        handleEditGoal: (metric: GoalMetricKey | 'calories') =>
            metric === 'calories'
                ? router.push('/(app)/goal-setup')
                : router.push({ pathname: '/(app)/metric-add', params: { metric, mode: 'goal' } }),
        handleReminders: () => router.push('/(app)/weigh-in-reminder'),
        handleAdd: (metric: ReadingMetricKey) => router.push({ pathname: '/(app)/metric-add', params: { metric } }),
    };
};
