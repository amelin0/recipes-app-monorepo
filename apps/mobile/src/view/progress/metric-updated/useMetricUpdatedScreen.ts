import { useCallback } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import { formatFullDate, formatThousands } from '@/shared/helpers';
import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { usePatchNutritionGoal } from '@/state/domains/nutrition';
import { useGetProgressMetrics } from '@/state/domains/progress';
import { useGetRecommendations } from '@/state/domains/user';

import type { GoalMetricKey, ReadingMetricKey } from '../progress.constants';
import type { MetricEntryMode } from '../metric-add/useMetricAddScreen';

export const useMetricUpdatedScreen = () => {
    const { t } = useAppTranslation(['common']);
    const {
        metric = 'weight',
        value = '',
        mode = 'reading',
        from,
    } = useLocalSearchParams<{
        metric?: ReadingMetricKey | GoalMetricKey;
        value?: string;
        mode?: MetricEntryMode;
        /** The tab the sheet was opened from; the progress tab by default. */
        from?: string;
    }>();

    const numeric = Number(value.replace(/,(?=\d{3}\b)/g, '').replace(',', '.'));
    const isGoal = mode === 'goal';

    // Норма рахується з ваги, тож після нового зважування рекомендація вже
    // інша — саме її пропонує цей екран.
    const { data: recommendations } = useGetRecommendations();
    const { data: cards } = useGetProgressMetrics();
    const patchGoal = usePatchNutritionGoal();

    const recommendedCalories = recommendations?.calories ?? null;
    const waistBound = cards?.find(card => card.metric === 'waist')?.recommendedMax ?? null;

    const handleDone = useCallback(() => {
        // Квитанція повертає туди, звідки прийшли: інакше зміна ваги з екрана
        // цілі викидала на «Прогрес» і закривала сам екран цілі.
        if (from === 'home') {
            router.dismissTo('/(app)/(tabs)/home');
            return;
        }
        if (from === 'goal-setup') {
            router.dismissTo('/(app)/goal-setup');
            return;
        }
        router.dismissTo('/(app)/(tabs)/progress');
    }, [from]);

    const handleConfirmGoal = useCallback(() => {
        if (recommendedCalories === null || patchGoal.isPending) {
            handleDone();
            return;
        }

        patchGoal.mutate(
            { dailyCalories: Math.round(recommendedCalories) },
            {
                onSuccess: handleDone,
                onError: () => ToastService.error(t('common:states.error')),
            },
        );
    }, [handleDone, patchGoal, recommendedCalories, t]);

    return {
        metric,
        isGoal,
        value,
        // Шит фіксує щойно зняте показання — сервер ставить сьогоднішню дату.
        date: formatFullDate(new Date()),
        /** Absent while the questionnaire has not enough answers to compute one. */
        recommendedGoal: recommendedCalories === null ? null : formatThousands(Math.round(recommendedCalories)),
        /** The note only appears while the reading sits inside the healthy range. */
        showsWaistNote:
            !isGoal && metric === 'waist' && waistBound !== null && !Number.isNaN(numeric) && numeric <= waistBound,
        isConfirming: patchGoal.isPending,
        handleDone,
        handleConfirmGoal,
    };
};
