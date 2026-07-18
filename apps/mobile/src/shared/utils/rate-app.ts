import * as Linking from 'expo-linking';
import * as StoreReview from 'expo-store-review';

import { ToastService } from '@/shared/services';

// TODO: localize once i18n lands.
const RATE_APP_UNAVAILABLE_MESSAGE = 'Оцінка застосунку зараз недоступна. Спробуйте пізніше.';

/**
 * Open the OS-native review prompt. When the in-app sheet is unavailable
 * (rate-limited, parental controls, missing config) and there's no fallback
 * store URL — surface an info toast so the user gets feedback.
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

        ToastService.info(RATE_APP_UNAVAILABLE_MESSAGE);
    } catch {
        ToastService.info(RATE_APP_UNAVAILABLE_MESSAGE);
    }
};
