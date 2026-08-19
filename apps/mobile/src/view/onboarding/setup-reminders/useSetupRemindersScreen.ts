import { useCallback } from 'react';

import { router } from 'expo-router';

import { useReminderSchedule } from '@/shared/hooks';

export const useSetupRemindersScreen = () => {
    const schedule = useReminderSchedule();

    // Reminders are the last question; the paywall closes the funnel either way.
    const handleClose = useCallback(() => {
        router.replace('/(app)/paywall');
    }, []);

    const handleSave = useCallback(() => {
        // TODO: persist the schedule and register the local notifications.
        router.replace('/(app)/paywall');
    }, []);

    return { ...schedule, handleClose, handleSave };
};
