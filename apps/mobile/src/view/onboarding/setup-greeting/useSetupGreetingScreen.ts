import { useCallback } from 'react';

import { router } from 'expo-router';

import { useStore } from '@/state';

export const useSetupGreetingScreen = () => {
    const name = useStore(state => state.profileSetup.name);

    const handleNext = useCallback(() => {
        router.push('/(app)/setup-gender');
    }, []);

    return { name, handleNext };
};
