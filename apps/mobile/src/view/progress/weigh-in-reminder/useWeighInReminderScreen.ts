import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { router } from 'expo-router';

import { formatFullDate } from '@/shared/helpers';
import { ToastService } from '@/shared/services';
import type { WheelPickerColumn } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';
import { useGetReminders, useUpdateReminders } from '@/state/domains/user';

/** Minutes the wheel offers, matching the reminders step elsewhere. */
const MINUTE_STEP = 5;
/** Fallback cadence while the server has not said what it is. */
const DEFAULT_CADENCE_DAYS = 14;

const pad = (value: number) => String(value).padStart(2, '0');
const range = (count: number) => Array.from({ length: count }, (_, index) => index);

export const useWeighInReminderScreen = () => {
    const { t } = useAppTranslation(['common']);
    const { data: reminders } = useGetReminders();
    const updateReminders = useUpdateReminders();

    const weighIn = reminders?.find(reminder => reminder.type === 'weigh_in');

    const [enabled, setEnabled] = useState(true);
    const [hour, setHour] = useState(14);
    const [minute, setMinute] = useState(35);

    // Засіваємо раз: рефетч посеред прокручування колеса смикнув би його з-під
    // пальця.
    const seeded = useRef(false);
    useEffect(() => {
        if (seeded.current || !weighIn) return;
        seeded.current = true;
        setEnabled(weighIn.enabled);
    }, [weighIn]);

    const hours = useMemo(() => range(24), []);
    const minutes = useMemo(() => range(60 / MINUTE_STEP).map(index => index * MINUTE_STEP), []);

    const columns: WheelPickerColumn[] = [
        {
            key: 'hour',
            items: hours.map(pad),
            selectedIndex: hours.indexOf(hour),
            onChange: index => setHour(hours[index] ?? hour),
        },
        {
            key: 'minute',
            items: minutes.map(pad),
            selectedIndex: Math.max(minutes.indexOf(minute), 0),
            onChange: index => setMinute(minutes[index] ?? minute),
        },
    ];

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
        columns,
        isSaving: updateReminders.isPending,
        handleClose: () => router.back(),
        handleSave,
    };
};
