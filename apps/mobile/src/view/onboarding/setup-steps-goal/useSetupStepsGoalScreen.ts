import { useCallback } from 'react';

import { router } from 'expo-router';

import { useStore } from '@/state';

import { STEPS_GOAL_DEFAULT, STEPS_GOAL_STEP } from '../onboarding.constants';

export const useSetupStepsGoalScreen = () => {
    const stored = useStore(state => state.profileSetup.stepsGoal);
    const setAnswer = useStore(state => state.setProfileSetupAnswerAction);

    const recommended = STEPS_GOAL_DEFAULT;
    const value = stored ?? recommended;

    const setValue = useCallback(
        (next: number) => setAnswer('stepsGoal', Math.max(next, STEPS_GOAL_STEP)),
        [setAnswer],
    );

    const handleNext = useCallback(() => {
        setAnswer('stepsGoal', value);
        router.push('/(app)/setup-summary');
    }, [setAnswer, value]);

    return {
        value,
        recommended,
        decrement: () => setValue(value - STEPS_GOAL_STEP),
        increment: () => setValue(value + STEPS_GOAL_STEP),
        handleNext,
    };
};
