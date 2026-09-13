import { useCallback } from 'react';

import { router } from 'expo-router';

import { formatFullDate } from '@/shared/helpers';
import { useReminderSchedule } from '@/shared/hooks';
import { useGetReminders, useUpdateReminders } from '@/state/domains/user';

export const useSetupRemindersScreen = () => {
    const { data } = useGetReminders();
    const updateReminders = useUpdateReminders();
    const schedule = useReminderSchedule(data);

    // Reminders are the last question; the paywall closes the funnel either way.
    const handleClose = useCallback(() => {
        router.replace('/(app)/paywall');
    }, []);

    const handleSave = useCallback(() => {
        if (updateReminders.isPending) return;

        // Онбординг не має куди показати помилку — тут нема тостів і кроку
        // назад. Тож пейвол відкриваємо в будь-якому разі: розклад лишається
        // на дефолтах, і його можна поправити в профілі.
        updateReminders.mutate(
            { reminders: schedule.toPayload() },
            {
                onSettled: () => router.replace('/(app)/paywall'),
            },
        );
    }, [schedule, updateReminders]);

    return {
        ...schedule,
        weighInDate: schedule.weighIn.nextFireAt ? formatFullDate(new Date(schedule.weighIn.nextFireAt)) : '',
        isSaving: updateReminders.isPending,
        handleClose,
        handleSave,
    };
};
