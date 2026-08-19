import { useCallback, useMemo, useState } from 'react';

import { router } from 'expo-router';

import { formatFullDate } from '@/shared/helpers';
import type { WheelPickerColumn } from '@/shared/ui/components';

/** Minutes the wheel offers, matching the reminders step elsewhere. */
const MINUTE_STEP = 5;
/** How far ahead the next weigh-in falls while the reminder is on. */
const CADENCE_DAYS = 14;

const pad = (value: number) => String(value).padStart(2, '0');
const range = (count: number) => Array.from({ length: count }, (_, index) => index);

export const useWeighInReminderScreen = () => {
    // TODO: read the saved schedule; the next date comes from the server.
    const [enabled, setEnabled] = useState(true);
    const [hour, setHour] = useState(14);
    const [minute, setMinute] = useState(35);

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

    const nextDate = useMemo(() => {
        const next = new Date();
        next.setDate(next.getDate() + CADENCE_DAYS);
        return formatFullDate(next);
    }, []);

    const handleSave = useCallback(() => {
        // TODO: persist the schedule and register the local notification.
        router.back();
    }, []);

    return {
        enabled,
        setEnabled,
        cadenceWeeks: CADENCE_DAYS / 7,
        nextDate,
        columns,
        handleClose: () => router.back(),
        handleSave,
    };
};
