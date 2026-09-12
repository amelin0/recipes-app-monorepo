import { useCallback } from 'react';

import { router } from 'expo-router';

import { useStore } from '@/state';
import type { Gender } from '@/state/domains/profile-setup';

import { useOnboardingStep } from '../useOnboardingStep';

export const useSetupGenderScreen = () => {
    const gender = useStore(state => state.profileSetup.gender);
    const setAnswer = useStore(state => state.setProfileSetupAnswerAction);
    const saveStep = useOnboardingStep(3);

    const selectGender = useCallback((value: Gender) => setAnswer('gender', value), [setAnswer]);

    const handleNext = useCallback(() => {
        if (gender) saveStep({ gender });
        router.push('/(app)/setup-birth-date');
    }, [gender, saveStep]);

    return { gender, selectGender, canProceed: gender !== null, handleNext };
};
