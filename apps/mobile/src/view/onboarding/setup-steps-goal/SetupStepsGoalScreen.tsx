import React from 'react';

import { useUnistyles } from 'react-native-unistyles';

import { formatThousands } from '@/shared/helpers';
import { useAppTranslation } from '@/shared/utils/translations';

import { SetupTargetStep } from '../components';
import { DIAL_RING } from '../onboarding.constants';

import { useSetupStepsGoalScreen } from './useSetupStepsGoalScreen';

/** Step 16 — daily step count (RF-mobile-app 864:120748). */
export const SetupStepsGoalScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const { theme } = useUnistyles();
    const { value, recommended, decrement, increment, handleNext } = useSetupStepsGoalScreen();

    return (
        <SetupTargetStep
            step={16}
            title={t('onboarding:setup.steps-goal.title')}
            subtitle={t('onboarding:setup.steps-goal.subtitle')}
            recommendationLabel={t('onboarding:setup.recommendation')}
            recommendationValue={t('onboarding:setup.steps-goal.recommended', {
                value: formatThousands(recommended),
            })}
            recommendationColor={theme.colors.elements.primary}
            value={value}
            unit={t('onboarding:setup.steps-goal.unit')}
            dialColor={theme.colors.branding.primary}
            ringColor={DIAL_RING.grey}
            onDecrement={decrement}
            onIncrement={increment}
            decrementLabel={t('onboarding:setup.decrease')}
            incrementLabel={t('onboarding:setup.increase')}
            onNext={handleNext}
        />
    );
};
