import { useCallback } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import { formatFullDate, formatThousands } from '@/shared/helpers';

import { RECOMMENDED_CALORIE_GOAL, type ReadingMetricKey, MOCK_WAIST_DETAIL } from '../progress.constants';

export const useMetricUpdatedScreen = () => {
    const { metric = 'weight', value = '' } = useLocalSearchParams<{ metric?: ReadingMetricKey; value?: string }>();

    const numeric = Number(value.replace(',', '.'));

    const handleDone = useCallback(() => {
        router.dismissTo('/(app)/(tabs)/progress');
    }, []);

    return {
        metric,
        value,
        // TODO: the entry's own timestamp once the API returns it.
        date: formatFullDate(new Date()),
        recommendedGoal: formatThousands(RECOMMENDED_CALORIE_GOAL),
        /** The note only appears while the reading sits inside the healthy range. */
        showsWaistNote: metric === 'waist' && !Number.isNaN(numeric) && numeric <= MOCK_WAIST_DETAIL.recommendedMaxCm,
        handleDone,
        // TODO: PATCH the calorie goal to the recommendation.
        handleConfirmGoal: handleDone,
    };
};
