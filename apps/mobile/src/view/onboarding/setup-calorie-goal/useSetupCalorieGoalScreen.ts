import { useCallback } from 'react';

import { router } from 'expo-router';

import { useStore } from '@/state';
import { useGetRecommendations } from '@/state/domains/user';

import { CALORIE_GOAL_DEFAULT, CALORIE_GOAL_STEP, CALORIE_WARNING_RATIO } from '../onboarding.constants';

export type CalorieDrift = 'ok' | 'low' | 'high';

export const useSetupCalorieGoalScreen = () => {
    const stored = useStore(state => state.profileSetup.calorieGoal);
    const setAnswer = useStore(state => state.setProfileSetupAnswerAction);
    const { data: recommendations } = useGetRecommendations();

    // Рекомендація рахується з відповідей і може бути `null`, якщо їх ще
    // бракує — тоді лишається цифра з дизайну, щоб екран не показав нуль.
    const recommended = recommendations?.calories ?? CALORIE_GOAL_DEFAULT;
    const value = stored ?? recommended;

    const setValue = useCallback(
        (next: number) => setAnswer('calorieGoal', Math.max(next, CALORIE_GOAL_STEP)),
        [setAnswer],
    );

    const drift: CalorieDrift =
        value < recommended * (1 - CALORIE_WARNING_RATIO)
            ? 'low'
            : value > recommended * (1 + CALORIE_WARNING_RATIO)
              ? 'high'
              : 'ok';

    const handleNext = useCallback(() => {
        setAnswer('calorieGoal', value);
        router.push('/(app)/setup-water-goal');
    }, [setAnswer, value]);

    return {
        value,
        recommended,
        drift,
        decrement: () => setValue(value - CALORIE_GOAL_STEP),
        increment: () => setValue(value + CALORIE_GOAL_STEP),
        handleNext,
    };
};
