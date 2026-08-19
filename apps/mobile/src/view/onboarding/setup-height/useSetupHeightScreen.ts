import { useCallback, useMemo } from 'react';

import { router } from 'expo-router';

import type { WheelPickerColumn } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';

import { DEFAULT_HEIGHT_CM, HEIGHT_CM_MAX, HEIGHT_CM_MIN } from '../onboarding.constants';
import { buildRange, cmToInch, inchToCm, nearestIndex } from '../onboarding.helpers';

export const useSetupHeightScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const unitSystem = useStore(state => state.profileSetup.unitSystem);
    const heightCm = useStore(state => state.profileSetup.heightCm) ?? DEFAULT_HEIGHT_CM;
    const setAnswer = useStore(state => state.setProfileSetupAnswerAction);

    const isMetric = unitSystem !== 'imperial';

    const values = useMemo(
        () =>
            isMetric
                ? buildRange(HEIGHT_CM_MIN, HEIGHT_CM_MAX)
                : buildRange(cmToInch(HEIGHT_CM_MIN), cmToInch(HEIGHT_CM_MAX)),
        [isMetric],
    );

    const unit = t(isMetric ? 'onboarding:setup.height.unit-metric' : 'onboarding:setup.height.unit-imperial');
    const current = isMetric ? heightCm : cmToInch(heightCm);

    const columns: WheelPickerColumn[] = [
        {
            key: 'height',
            items: values.map(value => `${value} ${unit}`),
            selectedIndex: nearestIndex(values, current),
            onChange: index => {
                const picked = values[index];
                if (picked === undefined) return;
                setAnswer('heightCm', isMetric ? picked : inchToCm(picked));
            },
        },
    ];

    const handleNext = useCallback(() => {
        setAnswer('heightCm', heightCm);
        router.push('/(app)/setup-benefit-macros');
    }, [heightCm, setAnswer]);

    return { columns, handleNext };
};
