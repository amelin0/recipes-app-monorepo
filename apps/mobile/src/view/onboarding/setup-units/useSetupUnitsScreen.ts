import { useCallback } from 'react';

import { router } from 'expo-router';

import { useStore } from '@/state';
import type { UnitSystem } from '@/state/domains/profile-setup';

export const useSetupUnitsScreen = () => {
    const unitSystem = useStore(state => state.profileSetup.unitSystem);
    const setAnswer = useStore(state => state.setProfileSetupAnswerAction);

    const selectUnitSystem = useCallback((value: UnitSystem) => setAnswer('unitSystem', value), [setAnswer]);

    const handleNext = useCallback(() => {
        router.push('/(app)/setup-weight');
    }, []);

    return { unitSystem, selectUnitSystem, canProceed: unitSystem !== null, handleNext };
};
