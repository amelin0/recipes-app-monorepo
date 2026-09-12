import { useCallback, useMemo } from 'react';

import { router } from 'expo-router';

import type { WheelPickerColumn } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';
import { buildRange } from '@/shared/helpers';
import { useStore } from '@/state';

import { DEFAULT_WEIGHT_KG, TARGET_WEIGHT_KG_MAX, TARGET_WEIGHT_KG_MIN } from '../onboarding.constants';
import { kgToLb, lbToKg, nearestIndex } from '../onboarding.helpers';

import { useOnboardingStep } from '../useOnboardingStep';

export const useSetupTargetWeightScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const unitSystem = useStore(state => state.profileSetup.unitSystem);
    const currentWeightKg = useStore(state => state.profileSetup.weightKg) ?? DEFAULT_WEIGHT_KG;
    const storedTarget = useStore(state => state.profileSetup.targetWeightKg);
    const goal = useStore(state => state.profileSetup.goal);
    const setAnswer = useStore(state => state.setProfileSetupAnswerAction);
    const saveStep = useOnboardingStep(13);

    // Opens on the weight the user just entered — the goal is expressed as a
    // move away from it, so that is the cheapest starting point.
    const targetKg = storedTarget ?? currentWeightKg;
    const isMetric = unitSystem !== 'imperial';

    const values = useMemo(
        () =>
            isMetric
                ? buildRange(TARGET_WEIGHT_KG_MIN, TARGET_WEIGHT_KG_MAX)
                : buildRange(kgToLb(TARGET_WEIGHT_KG_MIN), kgToLb(TARGET_WEIGHT_KG_MAX)),
        [isMetric],
    );

    const unit = t(
        isMetric ? 'onboarding:setup.target-weight.unit-metric' : 'onboarding:setup.target-weight.unit-imperial',
    );
    const current = isMetric ? targetKg : kgToLb(targetKg);

    const columns: WheelPickerColumn[] = [
        {
            key: 'target-weight',
            items: values.map(value => `${value} ${unit}`),
            selectedIndex: nearestIndex(values, current),
            onChange: index => {
                const picked = values[index];
                if (picked === undefined) return;
                setAnswer('targetWeightKg', isMetric ? picked : lbToKg(picked));
            },
        },
    ];

    const handleNext = useCallback(() => {
        setAnswer('targetWeightKg', targetKg);
        // «Навчитись готувати» — не вагова ціль, тож цільову вагу скидаємо:
        // `null` тут очищає відповідь, а не лишає її з минулого вибору.
        saveStep({ targetWeightKg: goal === 'learn-cooking' ? null : Math.round(targetKg * 10) / 10 });
        router.push('/(app)/setup-calorie-goal');
    }, [goal, saveStep, setAnswer, targetKg]);

    return { columns, handleNext };
};
