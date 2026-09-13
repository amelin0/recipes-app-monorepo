import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { router } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';
import { useGetOnboarding, useSaveOnboarding } from '@/state/domains/user';

import { ACTIVITY_LEVEL_MAX, ACTIVITY_LEVEL_MIN } from '../../onboarding/onboarding.constants';

export const useActivityEditScreen = () => {
    const { t } = useAppTranslation(['onboarding', 'common']);
    const setAnswer = useStore(state => state.setProfileSetupAnswerAction);
    const local = useStore(state => state.profileSetup.activityLevel);
    const saveOnboarding = useSaveOnboarding();

    /**
     * Рівень читаємо з сервера, а не лише з локального зрізу анкети: зріз
     * живе на пристрої, і після входу на іншому він порожній — шторка
     * відкривалась на «1», хоч у профілі стоїть інше.
     */
    const { data: onboarding } = useGetOnboarding();
    const saved = onboarding?.activityLevel ?? local;

    const [level, setLevel] = useState(saved ?? ACTIVITY_LEVEL_MIN);
    // Шторка може змонтуватись раніше за відповідь — тоді підхоплюємо її.
    const seeded = useRef(saved !== null && saved !== undefined);
    useEffect(() => {
        if (seeded.current || saved === null || saved === undefined) return;
        seeded.current = true;
        setLevel(saved);
    }, [saved]);

    const labels = useMemo(() => t('onboarding:setup.activity.levels', { returnObjects: true }) as string[], [t]);

    const handleClose = useCallback(() => {
        if (router.canGoBack()) router.back();
    }, []);

    const handleSave = useCallback(() => {
        if (saveOnboarding.isPending) return;

        setAnswer('activityLevel', level);
        // Рівень активності — відповідь анкети, і норма КБЖВ рахується з неї:
        // без запису на сервер рядок «Активність» лишався старим, а
        // рекомендація не перераховувалась.
        saveOnboarding.mutate(
            { activityLevel: level },
            {
                onSuccess: () => {
                    if (router.canGoBack()) router.back();
                },
                onError: () => ToastService.error(t('common:states.error')),
            },
        );
    }, [level, saveOnboarding, setAnswer, t]);

    return {
        level,
        setLevel,
        min: ACTIVITY_LEVEL_MIN,
        max: ACTIVITY_LEVEL_MAX,
        labels,
        canSave: level !== saved,
        isSaving: saveOnboarding.isPending,
        handleClose,
        handleSave,
    };
};
