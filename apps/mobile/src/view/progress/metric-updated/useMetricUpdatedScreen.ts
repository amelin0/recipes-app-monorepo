import { useCallback } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import { formatFullDate, formatThousands } from '@/shared/helpers';

import {
    MOCK_WAIST_DETAIL,
    RECOMMENDED_CALORIE_GOAL,
    type GoalMetricKey,
    type ReadingMetricKey,
} from '../progress.constants';
import type { MetricEntryMode } from '../metric-add/useMetricAddScreen';

export const useMetricUpdatedScreen = () => {
    const {
        metric = 'weight',
        value = '',
        mode = 'reading',
    } = useLocalSearchParams<{
        metric?: ReadingMetricKey | GoalMetricKey;
        value?: string;
        mode?: MetricEntryMode;
    }>();

    const numeric = Number(value.replace(/,(?=\d{3}\b)/g, '').replace(',', '.'));
    const isGoal = mode === 'goal';

    const handleDone = useCallback(() => {
        router.dismissTo('/(app)/(tabs)/progress');
    }, []);

    return {
        metric,
        isGoal,
        value,
        // TODO: the entry's own timestamp once the API returns it.
        date: formatFullDate(new Date()),
        recommendedGoal: formatThousands(RECOMMENDED_CALORIE_GOAL),
        /** The note only appears while the reading sits inside the healthy range. */
        showsWaistNote:
            !isGoal && metric === 'waist' && !Number.isNaN(numeric) && numeric <= MOCK_WAIST_DETAIL.recommendedMaxCm,
        handleDone,
        // TODO: PATCH the calorie goal to the recommendation.
        handleConfirmGoal: handleDone,
    };
};
