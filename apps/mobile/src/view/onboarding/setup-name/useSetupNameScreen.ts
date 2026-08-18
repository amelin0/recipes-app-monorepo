import { useCallback } from 'react';

import { router } from 'expo-router';

import { useStore } from '@/state';

export const useSetupNameScreen = () => {
    const name = useStore(state => state.profileSetup.name);
    const setAnswer = useStore(state => state.setProfileSetupAnswerAction);

    const setName = useCallback((value: string) => setAnswer('name', value), [setAnswer]);

    const handleNext = useCallback(() => {
        router.push('/(app)/setup-greeting');
    }, []);

    return {
        name,
        setName,
        canProceed: name.trim().length > 0,
        handleNext,
    };
};
