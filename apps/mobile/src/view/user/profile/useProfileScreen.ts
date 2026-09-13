import { useCallback, useMemo } from 'react';

import { router } from 'expo-router';

import { ToastService } from '@/shared/services';
import { appBuild, appVersion, requestRateApp } from '@/shared/utils';
import { formatDayMonthYear } from '@/shared/helpers';
import { useAppTranslation } from '@/shared/utils/translations';
import { useSignOut } from '@/state/domains/auth';
import { useGetSubscription } from '@/state/domains/subscription';
import { useGetProfile } from '@/state/domains/user';

export const useProfileScreen = () => {
    const { t } = useAppTranslation(['profile', 'common']);
    const signOut = useSignOut();

    const { data: profile, isLoading } = useGetProfile();
    const { data: subscriptionState } = useGetSubscription();

    const comingSoon = useCallback(() => {
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    const subscription = subscriptionState?.subscription ?? null;

    const subscriptionRow = useMemo(() => {
        if (!subscription) {
            return {
                // Free tier: the row invites rather than reporting a date.
                tag: t('profile:account.plans.free'),
                caption: t('profile:account.no-subscription'),
            };
        }

        return {
            tag: subscription.planName,
            caption: t('profile:account.valid-until', { date: formatDayMonthYear(subscription.expiresAt) }),
        };
    }, [subscription, t]);

    const handleLogout = useCallback(() => {
        void signOut();
    }, [signOut]);

    const email = profile?.email ?? '';
    // Імʼя зʼявляється лише після анкети або екрана редагування. Поки його
    // немає — пошта стає заголовком, а другий рядок ховається, щоб не
    // дублювати те саме значення двічі.
    const name = profile?.name?.trim() ?? '';

    return {
        isLoading,
        name: name || email,
        email,
        showEmail: Boolean(name),
        photoUrl: profile?.photoUrl ?? null,
        initials: profile?.initials || email.charAt(0).toUpperCase(),
        subscriptionTag: subscriptionRow.tag,
        subscriptionUntil: subscriptionRow.caption,
        versionLabel: t('profile:version', { version: appVersion, build: appBuild }),
        handleEdit: () => router.push('/(app)/profile-edit'),
        handleSubscription: () => router.push('/(app)/paywall'),
        handleRateUs: () => void requestRateApp(),
        handleReferral: () => router.push('/(app)/referral'),
        // TODO: бекенд не має зміни пароля в сесії — лише 3-кроковий скид
        // поштою (див. handoff/mobile-ui-review.md §4.1).
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
        handleDeleteAccount: () => router.push('/(app)/account-delete'),
        handleLogout,
    };
};
