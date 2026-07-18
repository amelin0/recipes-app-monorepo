import { useCallback } from 'react';

import { SUPPORTED_LANGUAGES, persistLanguage, useAppTranslation, type SupportedLanguage } from './i18n';

export const useLanguage = () => {
    const { i18n } = useAppTranslation();

    const changeLanguage = useCallback(
        async (language: SupportedLanguage) => {
            await i18n.changeLanguage(language);
            persistLanguage(language);
        },
        [i18n],
    );

    return {
        currentLanguage: i18n.language as SupportedLanguage,
        supportedLanguages: SUPPORTED_LANGUAGES,
        changeLanguage,
    };
};
