import { useCallback, useMemo, useState } from 'react';

import { router } from 'expo-router';

import { ToastService } from '@/shared/services';
import {
    SUPPORTED_LANGUAGES,
    useAppTranslation,
    useLanguage,
    type SupportedLanguage,
} from '@/shared/utils/translations';

export const useSettingsLanguageScreen = () => {
    const { t } = useAppTranslation(['profile']);
    const { currentLanguage, changeLanguage } = useLanguage();

    // The choice only lands on «Зберегти зміни», so the whole UI does not
    // re-render into another language mid-selection.
    const [selected, setSelected] = useState<SupportedLanguage>(currentLanguage);

    const languages = useMemo(
        () =>
            (Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[]).map(code => ({
                code,
                nativeName: SUPPORTED_LANGUAGES[code],
            })),
        [],
    );

    const handleSave = useCallback(() => {
        void changeLanguage(selected);
        ToastService.success(t('profile:settings.saved'));
        if (router.canGoBack()) {
            router.back();
        }
    }, [changeLanguage, selected, t]);

    return { languages, selected, select: setSelected, handleSave };
};
