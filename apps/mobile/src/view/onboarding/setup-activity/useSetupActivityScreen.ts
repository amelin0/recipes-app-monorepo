import { useCallback, useMemo } from 'react';

import { router } from 'expo-router';

import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';

import { ACTIVITY_LEVEL_MIN } from '../onboarding.constants';

export const useSetupActivityScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const activityLevel = useStore(state => state.profileSetup.activityLevel);
    const setAnswer = useStore(state => state.setProfileSetupAnswerAction);

    const labels = useMemo(
        () => (t('onboarding:setup.activity.levels', { returnObjects: true }) as string[]) ?? [],
        [t],
    );

    const setLevel = useCallback((value: number) => setAnswer('activityLevel', value), [setAnswer]);

    const handleNext = useCallback(() => {
        router.push('/(app)/setup-goal');
    }, []);

    return {
        // The stepper shows 0 until the user touches it (984:58074).
        level: activityLevel ?? 0,
        setLevel,
        labels,
        canProceed: activityLevel !== null && activityLevel >= ACTIVITY_LEVEL_MIN,
        handleNext,
    };
};
