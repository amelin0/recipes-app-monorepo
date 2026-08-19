import { useCallback } from 'react';

import { router } from 'expo-router';

export const useSetupBenefitPlanScreen = () => {
    const handleNext = useCallback(() => {
        router.push('/(app)/(tabs)/home');
    }, []);

    return { handleNext };
};
