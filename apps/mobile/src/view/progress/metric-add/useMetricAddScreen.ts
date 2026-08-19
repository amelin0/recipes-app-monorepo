import { useCallback, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import {
    MOCK_HEIGHT_DETAIL,
    MOCK_WAIST_DETAIL,
    MOCK_WEIGHT_DETAIL,
    READING_METRIC_CONFIG,
    type ReadingMetricKey,
} from '../progress.constants';

/** «78,2» — the design writes readings with a decimal comma (673:41675). */
const toDisplay = (value: number, precision: number) => value.toFixed(precision).replace('.', ',');
const toNumber = (text: string) => Number(text.replace(',', '.'));

export const useMetricAddScreen = () => {
    const { metric = 'weight' } = useLocalSearchParams<{ metric?: ReadingMetricKey }>();
    const config = READING_METRIC_CONFIG[metric];

    const current = {
        weight: MOCK_WEIGHT_DETAIL.currentKg,
        waist: MOCK_WAIST_DETAIL.currentCm,
        height: MOCK_HEIGHT_DETAIL.currentCm,
    }[metric];

    const [value, setValue] = useState(() => toDisplay(current, config.precision));

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
        // TODO: POST the reading; the confirmation should read the saved entry
        // back rather than carry it through the route.
        router.replace({ pathname: '/(app)/metric-updated', params: { metric, value } });
    }, [isValid, metric, value]);

    return {
        metric,
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
