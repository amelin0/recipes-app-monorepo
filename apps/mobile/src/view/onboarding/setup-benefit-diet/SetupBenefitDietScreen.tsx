import React from 'react';

import { useAppTranslation } from '@/shared/utils/translations';

import { SetupBenefit } from '../components';

import { useSetupBenefitDietScreen } from './useSetupBenefitDietScreen';

/** Step 9 — illustrated pitch, no question asked. */
export const SetupBenefitDietScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const { handleNext } = useSetupBenefitDietScreen();

    return (
        <SetupBenefit
            step={9}
            illustration={require('../../../../assets/images/onboarding/benefit-diet.png')}
            aspectRatio={343 / 280}
            title={t('onboarding:setup.benefit.diet.title')}
            subtitle={t('onboarding:setup.benefit.diet.subtitle')}
            onNext={handleNext}
        />
    );
};
