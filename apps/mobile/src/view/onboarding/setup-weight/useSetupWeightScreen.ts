import { useCallback, useMemo } from 'react';

import { router } from 'expo-router';

import type { WheelPickerColumn } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';
import { buildRange } from '@/shared/helpers';
import { useStore } from '@/state';

import { DEFAULT_WEIGHT_KG, WEIGHT_KG_MAX, WEIGHT_KG_MIN } from '../onboarding.constants';
import { kgToLb, lbToKg, nearestIndex } from '../onboarding.helpers';

export const useSetupWeightScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const unitSystem = useStore(state => state.profileSetup.unitSystem);
    const weightKg = useStore(state => state.profileSetup.weightKg) ?? DEFAULT_WEIGHT_KG;
    const setAnswer = useStore(state => state.setProfileSetupAnswerAction);

    const isMetric = unitSystem !== 'imperial';

    // The wheel is built in whichever unit the user picked on step 5; the answer
    // is stored metric so later screens never have to know which it was.
    const values = useMemo(
        () =>
            isMetric
                ? buildRange(WEIGHT_KG_MIN, WEIGHT_KG_MAX)
                : buildRange(kgToLb(WEIGHT_KG_MIN), kgToLb(WEIGHT_KG_MAX)),
        [isMetric],
    );

    const unit = t(isMetric ? 'onboarding:setup.weight.unit-metric' : 'onboarding:setup.weight.unit-imperial');
    const current = isMetric ? weightKg : kgToLb(weightKg);

    const columns: WheelPickerColumn[] = [
        {
            key: 'weight',
            items: values.map(value => `${value} ${unit}`),
            selectedIndex: nearestIndex(values, current),
            onChange: index => {
                const picked = values[index];
                if (picked === undefined) return;
                setAnswer('weightKg', isMetric ? picked : lbToKg(picked));
            },
        },
    ];

    const handleNext = useCallback(() => {
        setAnswer('weightKg', weightKg);
        router.push('/(app)/setup-height');
    }, [setAnswer, weightKg]);

    return { columns, handleNext };
};
