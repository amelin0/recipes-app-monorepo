import { useCallback } from 'react';

import { router } from 'expo-router';

import { useStore } from '@/state';
import { UNIT_QUANTITIES } from '@/state/domains/app';
import type { UnitSystem } from '@/state/domains/profile-setup';
import { toSettingsUnitsPayload, useUpdateSettings } from '@/state/domains/user';

export const useSetupUnitsScreen = () => {
    const unitSystem = useStore(state => state.profileSetup.unitSystem);
    const setAnswer = useStore(state => state.setProfileSetupAnswerAction);
    const setUnitPreference = useStore(state => state.setUnitPreference);
    const updateSettings = useUpdateSettings();

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
        if (unitSystem) {
            // Одиниці живуть у налаштуваннях профілю, не серед відповідей
            // анкети — тому йдуть окремим запитом, а не через `PUT /onboarding`.
            const all = { bodyMass: unitSystem, foodWeight: unitSystem, length: unitSystem, water: unitSystem };
            updateSettings.mutate(toSettingsUnitsPayload(all));
        }
        router.push('/(app)/setup-weight');
    }, [unitSystem, updateSettings]);

    return { unitSystem, selectUnitSystem, canProceed: unitSystem !== null, handleNext };
};
