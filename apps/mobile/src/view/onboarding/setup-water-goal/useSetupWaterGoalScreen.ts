import { useCallback } from 'react';

import { router } from 'expo-router';

import { useStore } from '@/state';

import { WATER_GOAL_ML_DEFAULT, WATER_GOAL_ML_STEP } from '../onboarding.constants';

export const useSetupWaterGoalScreen = () => {
    const stored = useStore(state => state.profileSetup.waterGoalMl);
    const setAnswer = useStore(state => state.setProfileSetupAnswerAction);

    const recommended = WATER_GOAL_ML_DEFAULT;
    const value = stored ?? recommended;

    const setValue = useCallback(
        (next: number) => setAnswer('waterGoalMl', Math.max(next, WATER_GOAL_ML_STEP)),
        [setAnswer],
    );

    const handleNext = useCallback(() => {
        setAnswer('waterGoalMl', value);
        router.push('/(app)/setup-steps-goal');
    }, [setAnswer, value]);

    return {
        value,
        recommended,
        decrement: () => setValue(value - WATER_GOAL_ML_STEP),
        increment: () => setValue(value + WATER_GOAL_ML_STEP),
        handleNext,
    };
};
