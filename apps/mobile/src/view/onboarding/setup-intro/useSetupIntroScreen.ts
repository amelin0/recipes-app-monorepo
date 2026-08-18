import { useCallback } from 'react';

import { router } from 'expo-router';

export const useSetupIntroScreen = () => {
    const handleStart = useCallback(() => {
        router.push('/(app)/setup-name');
    }, []);

    return { handleStart };
};
