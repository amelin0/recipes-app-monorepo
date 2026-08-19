import { useCallback } from 'react';

import { router } from 'expo-router';

import { useStore } from '@/state';
import type { Goal } from '@/state/domains/profile-setup';

export const useSetupGoalScreen = () => {
    const goal = useStore(state => state.profileSetup.goal);
    const setAnswer = useStore(state => state.setProfileSetupAnswerAction);

    const selectGoal = useCallback((value: Goal) => setAnswer('goal', value), [setAnswer]);

    const handleNext = useCallback(() => {
        router.push('/(app)/setup-target-weight');
    }, []);

    return { goal, selectGoal, canProceed: goal !== null, handleNext };
};
