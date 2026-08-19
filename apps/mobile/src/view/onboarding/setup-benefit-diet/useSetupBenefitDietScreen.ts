import { useCallback } from 'react';

import { router } from 'expo-router';

export const useSetupBenefitDietScreen = () => {
    const handleNext = useCallback(() => {
        router.push('/(app)/setup-benefit-plan');
    }, []);

    return { handleNext };
};
