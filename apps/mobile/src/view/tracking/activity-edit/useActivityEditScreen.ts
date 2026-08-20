import { useCallback, useMemo, useState } from 'react';

import { router } from 'expo-router';

import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';

import { ACTIVITY_LEVEL_MAX, ACTIVITY_LEVEL_MIN } from '../../onboarding/onboarding.constants';

export const useActivityEditScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const saved = useStore(state => state.profileSetup.activityLevel);
    const setAnswer = useStore(state => state.setProfileSetupAnswerAction);

    const [level, setLevel] = useState(saved ?? ACTIVITY_LEVEL_MIN);

    const labels = useMemo(() => t('onboarding:setup.activity.levels', { returnObjects: true }) as string[], [t]);

    const handleClose = useCallback(() => {
        if (router.canGoBack()) router.back();
    }, []);

    const handleSave = useCallback(() => {
        setAnswer('activityLevel', level);
        if (router.canGoBack()) router.back();
    }, [setAnswer, level]);

    return {
        level,
        setLevel,
        min: ACTIVITY_LEVEL_MIN,
        max: ACTIVITY_LEVEL_MAX,
        labels,
        canSave: level !== saved,
        handleClose,
        handleSave,
    };
};
