import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';

import { AppStorage } from '@/data/local/domains/app';

import * as uk from './locales/uk';

/**
 * Languages exposed in the app's language picker. Values are the native
 * names (rendered in the picker + the Settings row trailing value).
 *
 * Translation files only ship for `uk` today — other languages fall back to
 * Ukrainian at runtime via `fallbackLng`. Add the matching `<lang>/<ns>.json`
 * files (and register them in `resources` below) when the strings are ready.
 */
export const SUPPORTED_LANGUAGES = {
    uk: 'Українська',
    en: 'English',
    es: 'Español',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

const NAMESPACES = ['common', 'auth', 'tracking', 'recipes', 'shopping', 'profile'] as const;
export type AppNamespace = (typeof NAMESPACES)[number];

export const getInitialLanguage = (): SupportedLanguage => {
    // MMKV is a TurboModule — if its native side isn't ready at
    // the moment this runs (race during bundle init on iOS 26 +
    // New Architecture), reading throws an Obj-C NSException that
    // RN re-throws via RCTTurboModule and aborts the app. Wrap
    // the lookup so a cold-init race quietly falls back to `'uk'`
    // instead of taking the whole boot down.
    try {
        const saved = AppStorage.getAppLanguage();
        if (saved && saved in SUPPORTED_LANGUAGES) {
            return saved as SupportedLanguage;
        }
    } catch (e) {
        console.warn('[i18n] getAppLanguage threw at boot:', e);
    }
    return 'uk';
};

export const persistLanguage = (language: SupportedLanguage) => {
    AppStorage.saveAppLanguage(language);
};

const initialLanguage = getInitialLanguage();

i18n.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    lng: initialLanguage,
    fallbackLng: 'uk',
    defaultNS: 'common',
    ns: NAMESPACES as unknown as string[],
    resources: {
        uk: {
            common: uk.common,
            auth: uk.auth,
            tracking: uk.tracking,
            recipes: uk.recipes,
            shopping: uk.shopping,
            profile: uk.profile,
        },
    },
    interpolation: {
        escapeValue: false,
    },
    react: {
        useSuspense: false,
    },
});

export default i18n;
export { initialLanguage };

export const useAppTranslation = (keys?: AppNamespace[]) => {
    const { t, i18n } = useTranslation(keys);
    return { t, i18n };
};
