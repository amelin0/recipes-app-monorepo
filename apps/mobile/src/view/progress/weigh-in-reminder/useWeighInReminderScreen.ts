import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { router } from 'expo-router';

import { formatFullDate } from '@/shared/helpers';
import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useGetReminders, useUpdateReminders } from '@/state/domains/user';

/** Fallback cadence while the server has not said what it is. */
const DEFAULT_CADENCE_DAYS = 14;

export const useWeighInReminderScreen = () => {
    const { t } = useAppTranslation(['common']);
    const { data: reminders } = useGetReminders();
    const updateReminders = useUpdateReminders();

    const weighIn = reminders?.find(reminder => reminder.type === 'weigh_in');

    const [enabled, setEnabled] = useState(true);

    // Засіваємо раз: рефетч посеред прокручування колеса смикнув би його з-під
    // пальця.
    const seeded = useRef(false);
    useEffect(() => {
        if (seeded.current || !weighIn) return;
        seeded.current = true;
        setEnabled(weighIn.enabled);
    }, [weighIn]);

    const cadenceDays = weighIn?.periodicityDays ?? DEFAULT_CADENCE_DAYS;

    const nextDate = useMemo(() => {
        if (weighIn?.nextFireAt) return formatFullDate(new Date(weighIn.nextFireAt));
        const next = new Date();
        next.setDate(next.getDate() + cadenceDays);
        return formatFullDate(next);
    }, [cadenceDays, weighIn]);

    const handleSave = useCallback(() => {
        if (updateReminders.isPending || !reminders) return;

        // `PUT` бере весь набір — шлемо решту як є, міняючи лише зважування.
        // Час сюди не йде: ендпоінт приймає його лише для прийомів їжі, а
        // зважування несе періодичність (§4.6 — вона поки read-only).
        updateReminders.mutate(
            {
                reminders: reminders.map(reminder =>
                    reminder.type === 'weigh_in'
                        ? { type: reminder.type, enabled }
                        : { type: reminder.type, enabled: reminder.enabled, time: reminder.time ?? '08:00' },
                ),
            },
            {
                onSuccess: () => router.back(),
                onError: () => ToastService.error(t('common:states.error')),
            },
        );
    }, [enabled, reminders, t, updateReminders]);

    return {
        enabled,
        setEnabled,
        cadenceWeeks: Math.round(cadenceDays / 7),
        nextDate,
        isSaving: updateReminders.isPending,
        handleClose: () => router.back(),
        handleSave,
    };
};
