import { useCallback } from 'react';

import { router } from 'expo-router';

import { useStore } from '@/state';
import { UNIT_QUANTITIES } from '@/state/domains/app';
import type { UnitSystem } from '@/state/domains/profile-setup';

export const useSetupUnitsScreen = () => {
    const unitSystem = useStore(state => state.profileSetup.unitSystem);
    const setAnswer = useStore(state => state.setProfileSetupAnswerAction);
    const setUnitPreference = useStore(state => state.setUnitPreference);

    const selectUnitSystem = useCallback(
        (value: UnitSystem) => {
            setAnswer('unitSystem', value);
            // The questionnaire asks once; the profile screen refines the four
            // quantities separately, so seed them all from this answer.
            UNIT_QUANTITIES.forEach(quantity => setUnitPreference(quantity, value));
        },
        [setAnswer, setUnitPreference],
    );

    const handleNext = useCallback(() => {
        router.push('/(app)/setup-weight');
    }, []);

    return { unitSystem, selectUnitSystem, canProceed: unitSystem !== null, handleNext };
};
