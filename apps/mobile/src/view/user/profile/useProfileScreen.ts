import { useCallback } from 'react';

import { router } from 'expo-router';

import { ToastService } from '@/shared/services';
import { appBuild, appVersion, requestRateApp } from '@/shared/utils';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';

import { MOCK_PROFILE, MOCK_SUBSCRIPTION } from '../user.constants';

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
    // The questionnaire is the only place the app learns a real name so far.
    const setupName = useStore(state => state.profileSetup.name);

    const comingSoon = useCallback(() => {
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    const name = setupName || MOCK_PROFILE.name;

    return {
        name,
        email: MOCK_PROFILE.email,
        initials: buildInitials(name),
        subscriptionTag: t(`profile:account.plans.${MOCK_SUBSCRIPTION.plan}`),
        subscriptionUntil: t('profile:account.valid-until', { date: MOCK_SUBSCRIPTION.validUntil }),
        versionLabel: t('profile:version', { version: appVersion, build: appBuild }),
        handleEdit: () => router.push('/(app)/profile-edit'),
        handleSubscription: comingSoon,
        handleRateUs: () => void requestRateApp(),
        handleReferral: comingSoon,
        handleChangePassword: comingSoon,
        handleReminders: () => router.push('/(app)/settings-reminders'),
        handleLanguage: () => router.push('/(app)/settings-language'),
        handleTheme: () => router.push('/(app)/settings-theme'),
        handleUnits: () => router.push('/(app)/settings-units'),
        handleFeedback: () => router.push('/(app)/feedback'),
        handleFaq: () => router.push('/(app)/faq'),
        handleSupportChat: comingSoon,
        handlePrivacy: comingSoon,
        handleTerms: comingSoon,
        // TODO: confirm dialog + DELETE /me once the API ships.
        handleDeleteAccount: comingSoon,
        // Повний reset стору: auth + фільтри рецептів + список продуктів.
        handleLogout: reset,
    };
};
