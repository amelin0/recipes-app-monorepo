import { useCallback } from 'react';

import Constants from 'expo-constants';

import { ToastService } from '@/shared/services';
import { requestRateApp } from '@/shared/utils';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';

// TODO: replace with GET /me once the API ships.
const MOCK_USER_NAME = 'Олександр Купрінський';

const buildInitials = (name: string) =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word.charAt(0).toUpperCase())
        .join('');

export const useProfileScreen = () => {
    const { t } = useAppTranslation(['profile', 'common']);
    const reset = useStore(state => state.reset);

    const comingSoon = useCallback(() => {
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    return {
        name: MOCK_USER_NAME,
        initials: buildInitials(MOCK_USER_NAME),
        versionLabel: t('profile:version', { version: Constants.expoConfig?.version ?? '1.0.0' }),
        handleEdit: comingSoon,
        handleSubscription: comingSoon,
        handleRateUs: () => void requestRateApp(),
        handleLanguage: comingSoon,
        handleUnits: comingSoon,
        handleFaq: comingSoon,
        handlePrivacy: comingSoon,
        handleTerms: comingSoon,
        // TODO: confirm dialog + DELETE /me once the API ships.
        handleDeleteAccount: comingSoon,
        // Повний reset стору: auth + фільтри рецептів + список продуктів.
        handleLogout: reset,
    };
};
