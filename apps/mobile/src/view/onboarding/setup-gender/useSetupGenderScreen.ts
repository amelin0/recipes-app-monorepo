import { useCallback } from 'react';

import { router } from 'expo-router';

import { useStore } from '@/state';
import type { Gender } from '@/state/domains/profile-setup';

export const useSetupGenderScreen = () => {
    const gender = useStore(state => state.profileSetup.gender);
    const setAnswer = useStore(state => state.setProfileSetupAnswerAction);

    const selectGender = useCallback((value: Gender) => setAnswer('gender', value), [setAnswer]);

    const handleNext = useCallback(() => {
        router.push('/(app)/setup-birth-date');
    }, []);

    return { gender, selectGender, canProceed: gender !== null, handleNext };
};
