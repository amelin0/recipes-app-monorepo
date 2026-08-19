import { useCallback } from 'react';

import { router } from 'expo-router';

export const useSetupBenefitMacrosScreen = () => {
    const handleNext = useCallback(() => {
        router.push('/(app)/setup-benefit-diet');
    }, []);

    return { handleNext };
};
