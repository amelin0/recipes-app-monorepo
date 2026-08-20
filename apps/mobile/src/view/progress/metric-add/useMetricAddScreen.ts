import { useCallback, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import { formatThousands } from '@/shared/helpers';

import {
    GOAL_METRIC_CONFIG,
    MOCK_HEIGHT_DETAIL,
    MOCK_STEPS_DETAIL,
    MOCK_WAIST_DETAIL,
    MOCK_WATER_DETAIL,
    MOCK_WEIGHT_DETAIL,
    READING_METRIC_CONFIG,
    MACRO_GOAL_DEFAULTS,
    MACRO_GOAL_METRICS,
    type GoalMetricKey,
    type MacroGoalMetricKey,
    type ReadingMetricKey,
} from '../progress.constants';

/** Editing a reading you took, or the goal you are aiming at. */
export type MetricEntryMode = 'reading' | 'goal';

/**
 * «78,2» — the design writes fractional readings with a decimal comma
 * (673:41675) and groups whole ones in thousands, «5,000» (673:50419). The two
 * never collide: only weight has decimals, and it never reaches four digits.
 */
const toDisplay = (value: number, precision: number) =>
    precision > 0 ? value.toFixed(precision).replace('.', ',') : formatThousands(value);
const toNumber = (text: string) => Number(text.replace(/,(?=\d{3}\b)/g, '').replace(',', '.'));

export const useMetricAddScreen = () => {
    const { metric = 'weight', mode = 'reading' } = useLocalSearchParams<{
        metric?: ReadingMetricKey | GoalMetricKey;
        mode?: MetricEntryMode;
    }>();

    const isGoal = mode === 'goal';
    const isMacroGoal = isGoal && (MACRO_GOAL_METRICS as readonly string[]).includes(metric);
    const config = isGoal
        ? GOAL_METRIC_CONFIG[metric as GoalMetricKey]
        : READING_METRIC_CONFIG[metric as ReadingMetricKey];

    const current = isGoal
        ? {
              weight: MOCK_WEIGHT_DETAIL.goalKg,
              steps: MOCK_STEPS_DETAIL.goalSteps,
              water: MOCK_WATER_DETAIL.goalMl,
              ...MACRO_GOAL_DEFAULTS,
          }[metric as GoalMetricKey]
        : {
              weight: MOCK_WEIGHT_DETAIL.currentKg,
              waist: MOCK_WAIST_DETAIL.currentCm,
              height: MOCK_HEIGHT_DETAIL.currentCm,
          }[metric as ReadingMetricKey];

    // expo-router reuses this screen when the same route is opened with
    // different params, so the field is keyed to what it is editing rather than
    // seeded once.
    const entryKey = `${metric}:${mode}`;
    const [entry, setEntry] = useState(() => ({ key: entryKey, value: toDisplay(current, config.precision) }));
    if (entry.key !== entryKey) setEntry({ key: entryKey, value: toDisplay(current, config.precision) });

    const value = entry.value;
    const setValue = useCallback((next: string) => setEntry({ key: entryKey, value: next }), [entryKey]);

    const nudge = useCallback(
        (direction: 1 | -1) => {
            const next = toNumber(value) + direction * config.step;
            if (Number.isNaN(next)) return;
            setValue(toDisplay(Math.min(Math.max(next, config.min), config.max), config.precision));
        },
        [config, value],
    );

    const parsed = toNumber(value);
    const isValid = !Number.isNaN(parsed) && parsed >= config.min && parsed <= config.max;

    const handleSave = useCallback(() => {
        if (!isValid) return;
        // TODO: POST the reading (or PATCH the goal); the confirmation should
        // read the saved entry back rather than carry it through the route.
        if (isMacroGoal) {
            // A macro goal belongs to the goal screen that opened this sheet —
            // it has no receipt of its own (811:40272).
            router.back();
            return;
        }
        router.replace({ pathname: '/(app)/metric-updated', params: { metric, value, mode } });
    }, [isValid, isMacroGoal, metric, mode, value]);

    return {
        metric,
        mode,
        isGoal,
        /** The water and macro goals quote the recommendation in their copy. */
        subtitleParams: {
            value: isMacroGoal
                ? formatThousands(MACRO_GOAL_DEFAULTS[metric as MacroGoalMetricKey])
                : formatThousands(MOCK_WATER_DETAIL.goalMl),
        },
        value,
        setValue,
        isValid,
        canDecrease: !Number.isNaN(parsed) && parsed > config.min,
        handleDecrease: () => nudge(-1),
        handleIncrease: () => nudge(1),
        handleClose: () => router.back(),
        handleSave,
    };
};
