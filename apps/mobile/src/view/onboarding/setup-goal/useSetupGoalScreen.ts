import { useCallback } from 'react';

import { router } from 'expo-router';

import { useStore } from '@/state';
import type { Goal } from '@/state/domains/profile-setup';

import { useOnboardingStep } from '../useOnboardingStep';

export const useSetupGoalScreen = () => {
    const goal = useStore(state => state.profileSetup.goal);
    const setAnswer = useStore(state => state.setProfileSetupAnswerAction);
    const saveStep = useOnboardingStep(12);

    const selectGoal = useCallback((value: Goal) => setAnswer('goal', value), [setAnswer]);

    const handleNext = useCallback(() => {
        if (goal) saveStep({ goal });
        router.push('/(app)/setup-target-weight');
    }, [goal, saveStep]);

    return { goal, selectGoal, canProceed: goal !== null, handleNext };
};
