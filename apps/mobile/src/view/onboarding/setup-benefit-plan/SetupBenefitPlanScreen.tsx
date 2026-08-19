import React from 'react';

import { useAppTranslation } from '@/shared/utils/translations';

import { SetupBenefit } from '../components';

import { useSetupBenefitPlanScreen } from './useSetupBenefitPlanScreen';

/** Step 10 — illustrated pitch, no question asked. */
export const SetupBenefitPlanScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const { handleNext } = useSetupBenefitPlanScreen();

    return (
        <SetupBenefit
            step={10}
            illustration={require('../../../../assets/images/onboarding/benefit-plan.png')}
            aspectRatio={375 / 284}
            bleed
            title={t('onboarding:setup.benefit.plan.title')}
            subtitle={t('onboarding:setup.benefit.plan.subtitle')}
            onNext={handleNext}
        />
    );
};
