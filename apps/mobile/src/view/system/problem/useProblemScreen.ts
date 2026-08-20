import { useCallback } from 'react';

import { router } from 'expo-router';

export const useProblemScreen = () => {
    const handleReport = useCallback(() => {
        router.push('/(app)/feedback');
    }, []);

    return { handleReport };
};
