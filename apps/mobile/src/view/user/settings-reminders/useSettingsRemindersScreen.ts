import { useCallback } from 'react';

import { router } from 'expo-router';

import { useReminderSchedule } from '@/shared/hooks';
import { formatFullDate } from '@/shared/helpers';
import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useGetReminders, useUpdateReminders } from '@/state/domains/user';

export const useSettingsRemindersScreen = () => {
    const { t } = useAppTranslation(['profile', 'common']);
    const { data, isLoading, isError, refetch } = useGetReminders();
    const updateReminders = useUpdateReminders();
    const schedule = useReminderSchedule(data);

    const handleSave = useCallback(() => {
        if (updateReminders.isPending) return;

        updateReminders.mutate(
            { reminders: schedule.toPayload() },
            {
                onSuccess: () => {
                    // TODO: перереєструвати локальні сповіщення — модуля пушів у
                    // застосунку ще немає (handoff/mobile-ui-review.md §4.2).
                    ToastService.success(t('profile:settings.saved'));
                    if (router.canGoBack()) router.back();
                },
                onError: () => ToastService.error(t('common:states.error')),
            },
        );
    }, [schedule, t, updateReminders]);

    return {
        ...schedule,
        weighInDate: schedule.weighIn.nextFireAt ? formatFullDate(new Date(schedule.weighIn.nextFireAt)) : '',
        isLoading,
        isError,
        handleRetry: refetch,
        isSaving: updateReminders.isPending,
        handleSave,
    };
};
