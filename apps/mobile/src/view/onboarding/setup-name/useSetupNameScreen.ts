import { useCallback, useState } from 'react';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';

export const useSetupNameScreen = () => {
    const { t } = useAppTranslation();
    const [name, setName] = useState('');

    const handleNext = useCallback(() => {
        // TODO: step 2 of the questionnaire is not designed yet — the answer is
        // held in screen state until the wizard has somewhere to hand it to.
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    return {
        name,
        setName,
        canProceed: name.trim().length > 0,
        handleNext,
        /** 1-based index used by the progress bar. */
        step: 1,
    };
};
