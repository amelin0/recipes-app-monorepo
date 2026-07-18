import { readLocalData, writeLocalData } from '@/shared/services';

/**
 * App-level preferences persisted via MMKV (sync reads, fast enough to be
 * called during bootstrap, e.g. resolving the initial i18n language).
 * Values are mirrored into static fields as an in-memory cache so subsequent
 * reads skip the MMKV round-trip.
 */
export class AppStorage {
    private static _appLanguage?: string;
    private static _onboardingCompleted?: boolean;

    static saveAppLanguage(language: string) {
        AppStorage._appLanguage = language;
        writeLocalData('appLanguage', { appLanguage: language });
    }

    static getAppLanguage(): string | null {
        if (AppStorage._appLanguage) return AppStorage._appLanguage;

        const data = readLocalData<{ appLanguage: string }>('appLanguage');
        if (data?.appLanguage) {
            AppStorage._appLanguage = data.appLanguage;
            return data.appLanguage;
        }
        return null;
    }

    static saveOnboardingCompleted() {
        AppStorage._onboardingCompleted = true;
        writeLocalData('onboardingCompleted', { onboardingCompleted: true });
    }

    static getOnboardingCompleted(): boolean {
        if (AppStorage._onboardingCompleted) return true;

        const data = readLocalData<{ onboardingCompleted: boolean }>('onboardingCompleted');
        if (data?.onboardingCompleted) {
            AppStorage._onboardingCompleted = true;
            return true;
        }
        return false;
    }
}
