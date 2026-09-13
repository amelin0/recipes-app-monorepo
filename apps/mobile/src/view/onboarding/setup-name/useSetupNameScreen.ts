import { useCallback } from 'react';

import { router } from 'expo-router';

import { useStore } from '@/state';

import { useOnboardingStep } from '../useOnboardingStep';

export const useSetupNameScreen = () => {
    const name = useStore(state => state.profileSetup.name);
    const setAnswer = useStore(state => state.setProfileSetupAnswerAction);
    const saveStep = useOnboardingStep(1);

    const setName = useCallback((value: string) => setAnswer('name', value), [setAnswer]);

    const handleNext = useCallback(() => {
        saveStep({ name: name.trim() });
        router.push('/(app)/setup-greeting');
    }, [name, saveStep]);

    return {
        name,
        setName,
        canProceed: name.trim().length > 0,
        handleNext,
    };
};
