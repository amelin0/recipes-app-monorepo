import { useCallback } from 'react';

import { router } from 'expo-router';

export const useFeedbackSentScreen = () => {
    const handleDone = useCallback(() => {
        router.replace('/(app)/(tabs)/home');
    }, []);

    return { handleDone };
};
