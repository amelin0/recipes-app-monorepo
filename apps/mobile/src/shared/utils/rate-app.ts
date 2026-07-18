import * as Linking from 'expo-linking';
import * as StoreReview from 'expo-store-review';
import { t } from 'i18next';

import { ToastService } from '@/shared/services';

/**
 * Open the OS-native review prompt. When the in-app sheet is unavailable
 * (rate-limited, parental controls, missing config) and there's no fallback
 * store URL — surface a localized info toast so the user gets feedback.
 */
export const requestRateApp = async () => {
    try {
        const isAvailable = await StoreReview.isAvailableAsync();
        if (isAvailable) {
            await StoreReview.requestReview();
            return;
        }

        const storeUrl = StoreReview.storeUrl();
        if (storeUrl) {
            await Linking.openURL(storeUrl);
            return;
        }

        ToastService.info(t('common:errors.rate-app-unavailable'));
    } catch {
        ToastService.info(t('common:errors.rate-app-unavailable'));
    }
};
