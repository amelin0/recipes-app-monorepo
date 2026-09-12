import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Reminder, ReminderKind, ReminderPatch } from '@/data';
import { MEAL_REMINDERS, REMINDER_MINUTE_STEP } from '@/shared/constants';
import { buildRange } from '@/shared/helpers';
import type { WheelPickerColumn } from '@/shared/ui/components';

export type MealReminderKey = (typeof MEAL_REMINDERS)[number]['key'];
export type ReminderKey = MealReminderKey | 'weigh-in';

interface MealReminderState {
    key: MealReminderKey;
    enabled: boolean;
    hour: number;
    minute: number;
    expanded: boolean;
}

const pad = (value: number) => String(value).padStart(2, '0');

/** The weigh-in is the one reminder the API spells with an underscore. */
const toApiKind = (key: ReminderKey): ReminderKind => (key === 'weigh-in' ? 'weigh_in' : key);

const parseTime = (time: string | null, fallback: { hour: number; minute: number }) => {
    if (!time) return fallback;
    const [hour, minute] = time.split(':').map(Number);
    return {
        hour: Number.isFinite(hour) ? (hour as number) : fallback.hour,
        minute: Number.isFinite(minute) ? (minute as number) : fallback.minute,
    };
};

/**
 * The meal and weigh-in reminder schedule. Shared by the questionnaire step
 * (882:141275) and the profile screen (804:24801) — they edit the same thing.
 *
 * `saved` seeds the wheels from the server once it arrives. Seeded once, not
 * on every change: a refetch mid-edit would drag the wheel out from under the
 * finger that is turning it.
 */
export const useReminderSchedule = (saved?: Reminder[]) => {
    const [meals, setMeals] = useState<MealReminderState[]>(() =>
        MEAL_REMINDERS.map(meal => ({ ...meal, enabled: true, expanded: false })),
    );
    const [weighInEnabled, setWeighInEnabled] = useState(true);
    const [weighInNextAt, setWeighInNextAt] = useState<string | null>(null);

    const seeded = useRef(false);

    useEffect(() => {
        if (seeded.current || !saved?.length) return;
        seeded.current = true;

        setMeals(prev =>
            prev.map(meal => {
                const remote = saved.find(item => item.type === meal.key);
                if (!remote) return meal;
                const { hour, minute } = parseTime(remote.time, meal);
                return { ...meal, enabled: remote.enabled, hour, minute };
            }),
        );

        const weighIn = saved.find(item => item.type === 'weigh_in');
        if (weighIn) {
            setWeighInEnabled(weighIn.enabled);
            setWeighInNextAt(weighIn.nextFireAt);
        }
    }, [saved]);

    const hours = useMemo(() => buildRange(0, 23), []);
    const minutes = useMemo(() => buildRange(0, 59 / REMINDER_MINUTE_STEP).map(i => i * REMINDER_MINUTE_STEP), []);

    const toggle = useCallback((key: ReminderKey, value: boolean) => {
        if (key === 'weigh-in') {
            setWeighInEnabled(value);
            return;
        }
        setMeals(prev => prev.map(meal => (meal.key === key ? { ...meal, enabled: value } : meal)));
    }, []);

    // Only one wheel is open at a time — the design never shows two.
    const toggleExpanded = useCallback((key: ReminderKey) => {
        setMeals(prev => prev.map(meal => ({ ...meal, expanded: meal.key === key ? !meal.expanded : false })));
    }, []);

    const setTime = useCallback((key: ReminderKey, hour: number, minute: number) => {
        setMeals(prev => prev.map(meal => (meal.key === key ? { ...meal, hour, minute } : meal)));
    }, []);

    const timeColumnsFor = useCallback(
        (key: ReminderKey): WheelPickerColumn[] => {
            const meal = meals.find(item => item.key === key);
            if (!meal) return [];

            return [
                {
                    key: `${key}-hour`,
                    items: hours.map(pad),
                    selectedIndex: hours.indexOf(meal.hour),
                    onChange: index => setTime(key, hours[index] ?? meal.hour, meal.minute),
                },
                {
                    key: `${key}-minute`,
                    items: minutes.map(pad),
                    selectedIndex: Math.max(minutes.indexOf(meal.minute), 0),
                    onChange: index => setTime(key, meal.hour, minutes[index] ?? meal.minute),
                },
            ];
        },
        [hours, meals, minutes, setTime],
    );

    /**
     * The whole set, as `PUT /profile/reminders` wants it: meals carry a time,
     * the weigh-in must not — the server 422s on either mistake.
     */
    const toPayload = useCallback(
        (): ReminderPatch[] => [
            ...meals.map(meal => ({
                type: toApiKind(meal.key),
                enabled: meal.enabled,
                time: `${pad(meal.hour)}:${pad(meal.minute)}`,
            })),
            { type: 'weigh_in' as ReminderKind, enabled: weighInEnabled },
        ],
        [meals, weighInEnabled],
    );

    return {
        // The design writes the hour unpadded — «8:00», not «08:00» (804:24801).
        reminders: meals.map(meal => ({ ...meal, time: `${meal.hour}:${pad(meal.minute)}` })),
        weighIn: { enabled: weighInEnabled, nextFireAt: weighInNextAt },
        toggle,
        toggleExpanded,
        timeColumnsFor,
        toPayload,
    };
};
