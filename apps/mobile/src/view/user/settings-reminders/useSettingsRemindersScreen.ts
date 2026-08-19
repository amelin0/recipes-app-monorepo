import { useCallback } from 'react';

import { router } from 'expo-router';

import { useReminderSchedule } from '@/shared/hooks';
import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';

export const useSettingsRemindersScreen = () => {
    const { t } = useAppTranslation(['profile']);
    const schedule = useReminderSchedule();

    const handleSave = useCallback(() => {
        // TODO: persist the schedule and re-register the local notifications.
        ToastService.success(t('profile:settings.saved'));
        if (router.canGoBack()) {
            router.back();
        }
    }, [t]);

    return { ...schedule, handleSave };
};
