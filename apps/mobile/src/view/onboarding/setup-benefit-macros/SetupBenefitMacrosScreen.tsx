import React from 'react';

import { useAppTranslation } from '@/shared/utils/translations';

import { SetupBenefit } from '../components';

import { MacroGaugeGraphic } from './components';
import { useSetupBenefitMacrosScreen } from './useSetupBenefitMacrosScreen';

/** Step 8 — illustrated pitch, no question asked. */
export const SetupBenefitMacrosScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const { handleNext } = useSetupBenefitMacrosScreen();

    return (
        <SetupBenefit
            step={8}
            graphic={<MacroGaugeGraphic />}
            title={t('onboarding:setup.benefit.macros.title')}
            subtitle={t('onboarding:setup.benefit.macros.subtitle')}
            subtitleVariant="bodyMediumReg"
            onNext={handleNext}
        />
    );
};
