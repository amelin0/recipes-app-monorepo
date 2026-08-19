import { useCallback } from 'react';

import { router } from 'expo-router';

export const useAccountRestoredScreen = () => {
    const handleContinue = useCallback(() => {
        router.replace('/(app)/(tabs)/home');
    }, []);

    return { handleContinue };
};
