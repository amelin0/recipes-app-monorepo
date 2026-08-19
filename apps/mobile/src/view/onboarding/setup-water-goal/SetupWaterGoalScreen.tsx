import React from 'react';

import { useUnistyles } from 'react-native-unistyles';

import { formatThousands } from '@/shared/helpers';
import { useAppTranslation } from '@/shared/utils/translations';

import { SetupTargetStep } from '../components';
import { DIAL_RING } from '../onboarding.constants';

import { useSetupWaterGoalScreen } from './useSetupWaterGoalScreen';

/** Step 15 — daily water intake (RF-mobile-app 864:120506). */
export const SetupWaterGoalScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const { theme } = useUnistyles();
    const { value, recommended, decrement, increment, handleNext } = useSetupWaterGoalScreen();

    return (
        <SetupTargetStep
            step={15}
            title={t('onboarding:setup.water-goal.title')}
            subtitle={t('onboarding:setup.water-goal.subtitle')}
            recommendationLabel={t('onboarding:setup.recommendation')}
            recommendationValue={t('onboarding:setup.water-goal.recommended', {
                value: formatThousands(recommended),
            })}
            recommendationColor={theme.colors.semantic.ocean}
            value={value}
            unit={t('onboarding:setup.water-goal.unit')}
            dialColor={theme.colors.semantic.ocean}
            ringColor={DIAL_RING.ocean}
            onDecrement={decrement}
            onIncrement={increment}
            decrementLabel={t('onboarding:setup.decrease')}
            incrementLabel={t('onboarding:setup.increase')}
            onNext={handleNext}
        />
    );
};
