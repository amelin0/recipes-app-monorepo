import React from 'react';

import { useUnistyles } from 'react-native-unistyles';

import { formatThousands } from '@/shared/helpers';
import { useAppTranslation } from '@/shared/utils/translations';

import { SetupTargetStep } from '../components';

import { useSetupCalorieGoalScreen } from './useSetupCalorieGoalScreen';

/** Step 14 — daily calories, adjustable around the recommendation (864:120050). */
export const SetupCalorieGoalScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const { theme } = useUnistyles();
    const { value, recommended, drift, decrement, increment, handleNext } = useSetupCalorieGoalScreen();

    const dial = {
        ok: { color: theme.colors.semantic.positive, ring: 'rgba(0, 171, 60, 0.12)' },
        low: { color: theme.colors.semantic.orange, ring: 'rgba(255, 140, 64, 0.12)' },
        high: { color: theme.colors.semantic.negative, ring: 'rgba(255, 0, 33, 0.12)' },
    }[drift];

    return (
        <SetupTargetStep
            step={14}
            title={t('onboarding:setup.calorie-goal.title')}
            subtitle={t('onboarding:setup.calorie-goal.subtitle')}
            recommendationLabel={t('onboarding:setup.recommendation')}
            recommendationValue={t('onboarding:setup.calorie-goal.recommended', {
                value: formatThousands(recommended),
            })}
            recommendationColor={theme.colors.semantic.positive}
            value={value}
            unit={t('onboarding:setup.calorie-goal.unit')}
            dialColor={dial.color}
            ringColor={dial.ring}
            onDecrement={decrement}
            onIncrement={increment}
            decrementLabel={t('onboarding:setup.decrease')}
            incrementLabel={t('onboarding:setup.increase')}
            warning={drift === 'ok' ? undefined : t(`onboarding:setup.calorie-goal.warning-${drift}`)}
            onNext={handleNext}
        />
    );
};
