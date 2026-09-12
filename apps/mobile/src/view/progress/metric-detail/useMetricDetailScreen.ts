import { useCallback, useMemo, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';

import type { ProgressPoint } from '@/data';
import { formatFullDate, formatDayHeader, formatThousands, fromIsoDay } from '@/shared/helpers';
import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useGetPlan } from '@/state/domains/meal-plan';
import { PROGRESS_DEFAULT_DAYS, useGetProgressMetric } from '@/state/domains/progress';

import type { BarGroup, LinePoint, MetricHeadlineValue, MetricStatBox } from '../components';
import { barChartMax, buildAxis, buildBarAxis, pointLabel, toLinePoints } from '../progress.helpers';
import type { MetricKey } from '../progress.constants';

/** Metrics logged once in a while, against no daily goal. */
const READING_METRICS: MetricKey[] = ['weight', 'waist', 'height'];
/** Metrics whose top bar offers a way to add a reading. */
const ADDABLE_METRICS: MetricKey[] = ['weight', 'steps', 'waist', 'height'];

/** The bar charts show a week, as the design does. */
const BAR_DAYS = 7;

export interface MetricRecord {
    id: string;
    title: string;
    value: number;
    /** Change against the previous reading — reading metrics only. */
    delta?: number;
}

export const useMetricDetailScreen = () => {
    const { t } = useAppTranslation(['progress', 'common']);
    const { theme } = useUnistyles();
    const { metric = 'weight' } = useLocalSearchParams<{ metric?: MetricKey }>();

    const [nutrientTab, setNutrientTab] = useState('calories');

    const { data, isLoading, isError, refetch } = useGetProgressMetric(metric);
    const card = data?.card;
    const summary = data?.summary;

    const comingSoon = useCallback(() => {
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    const format = formatThousands;
    const isReading = READING_METRICS.includes(metric);

    // Заплановане несе лише план — прогрес його не рахує.
    const planRange = useMemo(() => {
        const points = card?.points ?? [];
        const recent = points.slice(-BAR_DAYS);
        return { from: recent[0]?.date ?? '', to: recent[recent.length - 1]?.date ?? '' };
    }, [card]);
    const { data: planDays } = useGetPlan(planRange.from, planRange.to);

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

    const points = useMemo(() => card?.points ?? [], [card]);
    const recent = useMemo(() => points.slice(-BAR_DAYS), [points]);
    const current = card?.current ?? 0;
    const goalValue = card?.goal ?? 0;

    /** Latest value of a daily metric — «Сьогодні» on the headline. */
    const todayValue = recent[recent.length - 1]?.value ?? 0;

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
                        value: current.toFixed(1),
                        unit: units.weight,
                        // `difference` — поточне мінус ціль, тобто зі знаком
                        // напрямку. Підпис каже «до цілі», тож напрямок у
                        // ньому вже є: показуємо саму відстань, інакше
                        // виходило б «+-1.2».
                        note:
                            data?.difference === null || data?.difference === undefined
                                ? undefined
                                : t('progress:detail.to-goal-plain', {
                                      value: `${Math.abs(data.difference).toFixed(1)} ${units.weight}`,
                                  }),
                        noteColor: theme.colors.semantic.positive,
                    },
                    goalCard(
                        t('progress:labels.goal'),
                        card?.goal === null || card?.goal === undefined ? '—' : card.goal.toFixed(1),
                        units.weight,
                    ),
                ];
            case 'calories':
                return [
                    {
                        label: t('progress:labels.today'),
                        value: format(Math.round(todayValue)),
                        unit: units.calories,
                        note:
                            goalValue > 0
                                ? t('progress:detail.to-goal-plain', {
                                      value: format(Math.max(Math.round(goalValue - todayValue), 0)),
                                  })
                                : undefined,
                        noteColor: theme.colors.semantic.positive,
                    },
                    goalCard(t('progress:labels.goal'), format(Math.round(goalValue)), units.calories),
                ];
            case 'water':
                return [
                    { label: t('progress:labels.today'), value: format(Math.round(todayValue)), unit: units.water },
                    goalCard(t('progress:labels.goal'), format(Math.round(goalValue)), t('progress:units.ml-per-day')),
                ];
            case 'steps':
                return [
                    { label: t('progress:labels.today'), value: format(Math.round(todayValue)), unit: units.steps },
                    goalCard(
                        t('progress:labels.goal'),
                        format(Math.round(goalValue)),
                        t('progress:units.steps-per-day'),
                    ),
                ];
            case 'waist':
                return [
                    { label: t('progress:waist.current'), value: String(current), unit: units.waist },
                    // Межу дає ВООЗ і знає сервер (вона різна за статтю) —
                    // без неї друга картка не має що стверджувати.
                    ...(card?.recommendedMax === null || card?.recommendedMax === undefined
                        ? []
                        : [
                              {
                                  label: t('progress:waist.recommended'),
                                  value: `<${card.recommendedMax}`,
                                  unit: units.waist,
                                  valueColor: theme.colors.semantic.ocean,
                              },
                          ]),
                ];
            default:
                return [{ label: t('progress:height.current'), value: current.toFixed(1), unit: units.height }];
        }
    }, [card, current, data, format, goalValue, metric, t, theme, todayValue, units]);

    const statRows: MetricStatBox[][] = useMemo(() => {
        if (!summary) return [];

        const range = (precision: number, rangeUnit: string, averageLabel: string) => [
            [
                {
                    key: 'min',
                    label: t('progress:labels.min'),
                    value: summary.min === null ? '—' : summary.min.toFixed(precision),
                    unit: rangeUnit,
                },
                {
                    key: 'avg',
                    label: averageLabel,
                    value: summary.avg === null ? '—' : summary.avg.toFixed(precision),
                    unit: rangeUnit,
                },
                {
                    key: 'max',
                    label: t('progress:labels.max'),
                    value: summary.max === null ? '—' : summary.max.toFixed(precision),
                    unit: rangeUnit,
                },
            ],
        ];

        switch (metric) {
            case 'weight':
                return range(1, units.weight, t('progress:labels.average-f'));
            case 'water':
                return range(0, t('progress:units.ml-per-day'), t('progress:labels.average-n'));
            case 'steps':
                return range(0, t('progress:units.steps-per-day'), t('progress:labels.average-f'));
            case 'calories': {
                const total = (summary.daysUnder ?? 0) + (summary.daysOnTarget ?? 0) + (summary.daysOver ?? 0);
                const ofDays = t('progress:detail.of-days', { value: total });
                return [
                    [
                        {
                            key: 'min-norm',
                            label: t('progress:detail.min-norm'),
                            value: `<${format(Math.round(summary.lowerBound ?? 0))}`,
                            unit: t('progress:units.kcal-per-day'),
                        },
                        {
                            key: 'max-norm',
                            label: t('progress:detail.max-norm'),
                            value: `>${format(Math.round(summary.upperBound ?? 0))}`,
                            unit: t('progress:units.kcal-per-day'),
                        },
                    ],
                    [
                        {
                            key: 'under',
                            label: t('progress:legend.under'),
                            value: String(summary.daysUnder ?? 0),
                            unit: ofDays,
                            valueColor: theme.colors.semantic.orange,
                        },
                        {
                            key: 'within',
                            label: t('progress:detail.within-norm'),
                            value: String(summary.daysOnTarget ?? 0),
                            unit: ofDays,
                        },
                        {
                            key: 'outside',
                            label: t('progress:detail.outside-norm'),
                            value: String(summary.daysOver ?? 0),
                            unit: ofDays,
                            valueColor: theme.colors.semantic.negative,
                        },
                    ],
                ];
            }
            default:
                // Waist and height carry no period summary in the design.
                return [];
        }
    }, [format, metric, summary, t, theme, units]);

    const linePoints: LinePoint[] = useMemo(() => {
        const line = toLinePoints(points);
        if (metric !== 'waist' || card?.recommendedMax === null || card?.recommendedMax === undefined) return line;

        const bound = card.recommendedMax;
        // A waist reading over the recommended bound is marked as such.
        return line.map(point => ({
            ...point,
            color: point.value > bound ? theme.colors.semantic.negative : theme.colors.semantic.positive,
        }));
    }, [card, metric, points, theme]);

    const lineAxis = useMemo(
        () =>
            buildAxis(
                linePoints.map(point => point.value),
                [card?.goal ?? null, card?.recommendedMax ?? null],
            ),
        [card, linePoints],
    );

    const bars = useMemo(() => {
        if (metric === 'calories') {
            const groups: BarGroup[] = recent.map(point => {
                const day = planDays?.find(entry => entry.date === point.date);
                return {
                    label: pointLabel(point.date),
                    bars: [
                        {
                            key: 'planned',
                            value: Math.round(day?.planned.calories ?? 0),
                            color: theme.colors.semantic.ocean,
                        },
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
                };
            });
            const max = barChartMax(
                groups.flatMap(group => group.bars.map(bar => bar.value)),
                goalValue,
            );
            return { groups, max, axis: buildBarAxis(max, value => String(value)) };
        }

        const groups: BarGroup[] = recent.map(point => ({
            label: pointLabel(point.date),
            bars: [
                {
                    key: 'value',
                    value: Math.round(point.value),
                    color:
                        goalValue > 0 && point.value >= goalValue
                            ? theme.colors.branding.accent
                            : theme.colors.semantic.orange,
                },
            ],
        }));
        const max = barChartMax(
            recent.map(point => point.value),
            goalValue,
        );

        return {
            groups,
            max,
            axis:
                metric === 'water'
                    ? buildBarAxis(max, value => t('progress:water.axis-litres', { value: (value / 1000).toFixed(0) }))
                    : buildBarAxis(max, value =>
                          t('progress:steps.axis-thousands', { value: Math.round(value / 1000) }),
                      ),
        };
    }, [goalValue, metric, planDays, recent, t, theme]);

    /**
     * The log, newest first.
     *
     * A reading metric lists what was measured and how it moved; a daily one
     * lists what each day came to. Both are the same points the chart draws —
     * a second source would let the two disagree.
     */
    const records: MetricRecord[] = useMemo(() => {
        const reversed = [...points].reverse();

        if (isReading) {
            return reversed.map((point: ProgressPoint, index) => {
                const previous = reversed[index + 1];
                return {
                    id: point.id ?? point.date,
                    title: formatFullDate(fromIsoDay(point.date)),
                    value: point.value,
                    // Найперше показання нема з чим порівнювати — дизайн лишає
                    // його правий бік порожнім (673:32938).
                    delta: previous ? Math.round((point.value - previous.value) * 10) / 10 : undefined,
                };
            });
        }

        return reversed.slice(0, BAR_DAYS * 4).map(point => ({
            id: point.date,
            title: formatDayHeader(fromIsoDay(point.date)),
            value: Math.round(point.value),
        }));
    }, [isReading, points]);

    /**
     * Which way a reading has to move to count as progress.
     *
     * Without it a loss would always read red — which is backwards for the
     * person whose goal is to lose weight, and that is most of them.
     * `null` when there is no goal to move towards.
     */
    const progressDirection: 'down' | 'up' | null =
        card?.goal === null || card?.goal === undefined || card.goal === current
            ? null
            : card.goal < current
              ? 'down'
              : 'up';

    return {
        metric,
        progressDirection,
        isLoading,
        isError,
        handleRetry: refetch,
        isReading,
        canAdd: ADDABLE_METRICS.includes(metric),
        /** The design gives these two a period label; weight and height differ. */
        chartTitle:
            metric === 'weight'
                ? t('progress:detail.dynamics')
                : t('progress:detail.dynamics-days', { value: PROGRESS_DEFAULT_DAYS }),
        headline,
        // Waist reads as two statements rather than a comparison (1024:31123).
        headlineDirection: metric === 'waist' ? ('column' as const) : ('row' as const),
        statRows,
        linePoints,
        lineAxis,
        bars,
        records,
        goalValue,
        unit,
        nutrientTab,
        setNutrientTab,
        format,
        // Daily metrics are logged from the home screen, not from here.
        handleAdd: () =>
            isReading ? router.push({ pathname: '/(app)/metric-add', params: { metric } }) : comingSoon(),
        // Calories keep their own full goal screen; the rest edit in a sheet.
        handleEditGoal: () =>
            metric === 'calories'
                ? router.push('/(app)/goal-setup')
                : router.push({ pathname: '/(app)/metric-add', params: { metric, mode: 'goal' } }),
        handleReminders: () => (metric === 'weight' ? router.push('/(app)/weigh-in-reminder') : comingSoon()),
    };
};
