import { useCallback, useMemo, useState } from 'react';

import { MEAL_REMINDERS, MOCK_WEIGH_IN_DATE, REMINDER_MINUTE_STEP } from '@/shared/constants';
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

/**
 * The meal and weigh-in reminder schedule. Shared by the questionnaire step
 * (882:141275) and the profile screen (804:24801) — they edit the same thing.
 *
 * TODO: seed from and write back the saved schedule once the API ships.
 */
export const useReminderSchedule = () => {
    const [meals, setMeals] = useState<MealReminderState[]>(() =>
        MEAL_REMINDERS.map(meal => ({ ...meal, enabled: true, expanded: false })),
    );
    const [weighInEnabled, setWeighInEnabled] = useState(true);

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

    return {
        // The design writes the hour unpadded — «8:00», not «08:00» (804:24801).
        reminders: meals.map(meal => ({ ...meal, time: `${meal.hour}:${pad(meal.minute)}` })),
        weighIn: { enabled: weighInEnabled, nextDate: MOCK_WEIGH_IN_DATE },
        toggle,
        toggleExpanded,
        timeColumnsFor,
    };
};
