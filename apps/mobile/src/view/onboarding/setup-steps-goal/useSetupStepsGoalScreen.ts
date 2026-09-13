import { useCallback } from 'react';

import { router } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';
import { useCompleteOnboarding, useGetRecommendations } from '@/state/domains/user';

import {
    CALORIE_GOAL_DEFAULT,
    STEPS_GOAL_DEFAULT,
    STEPS_GOAL_STEP,
    WATER_GOAL_ML_DEFAULT,
} from '../onboarding.constants';

export const useSetupStepsGoalScreen = () => {
    const { t } = useAppTranslation(['common']);
    const stored = useStore(state => state.profileSetup.stepsGoal);
    const calorieGoal = useStore(state => state.profileSetup.calorieGoal);
    const waterGoalMl = useStore(state => state.profileSetup.waterGoalMl);
    const setAnswer = useStore(state => state.setProfileSetupAnswerAction);

    const { data: recommendations } = useGetRecommendations();
    const completeOnboarding = useCompleteOnboarding();

    const recommended = recommendations?.steps ?? STEPS_GOAL_DEFAULT;
    const value = stored ?? recommended;

    const setValue = useCallback(
        (next: number) => setAnswer('stepsGoal', Math.max(next, STEPS_GOAL_STEP)),
        [setAnswer],
    );

    /**
     * The last of the three norms, so this is where the questionnaire closes:
     * the three targets only mean anything together — a calorie target with no
     * water target is not half a goal.
     */
    const handleNext = useCallback(() => {
        if (completeOnboarding.isPending) return;
        setAnswer('stepsGoal', value);

        completeOnboarding.mutate(
            {
                dailyCalories: Math.round(calorieGoal ?? recommendations?.calories ?? CALORIE_GOAL_DEFAULT),
                dailyWaterMl: Math.round(waterGoalMl ?? recommendations?.waterMl ?? WATER_GOAL_ML_DEFAULT),
                dailySteps: Math.round(value),
            },
            {
                onSuccess: () => router.push('/(app)/setup-summary'),
                // Незавершена анкета лишила б застосунок зачиненим за гейтом на
                // `index`, тож далі не пускаємо, поки запит не пройде.
                onError: () => ToastService.error(t('common:states.error')),
            },
        );
    }, [calorieGoal, completeOnboarding, recommendations, setAnswer, t, value, waterGoalMl]);

    return {
        value,
        recommended,
        isSubmitting: completeOnboarding.isPending,
        decrement: () => setValue(value - STEPS_GOAL_STEP),
        increment: () => setValue(value + STEPS_GOAL_STEP),
        handleNext,
    };
};
