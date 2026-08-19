import { useCallback, useMemo, useState } from 'react';

import { router } from 'expo-router';

import type { WheelPickerColumn } from '@/shared/ui/components';

import { MEAL_REMINDERS, REMINDER_MINUTE_STEP } from '../onboarding.constants';
import { buildRange } from '../onboarding.helpers';

export type ReminderKey = (typeof MEAL_REMINDERS)[number]['key'] | 'weigh-in';

interface MealReminderState {
    key: (typeof MEAL_REMINDERS)[number]['key'];
    enabled: boolean;
    hour: number;
    minute: number;
    expanded: boolean;
}

const pad = (value: number) => String(value).padStart(2, '0');

export const useSetupRemindersScreen = () => {
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

    // Reminders are the last question; the paywall closes the funnel either way.
    const handleClose = useCallback(() => {
        router.replace('/(app)/paywall');
    }, []);

    const handleSave = useCallback(() => {
        // TODO: persist the schedule and register the local notifications.
        router.replace('/(app)/paywall');
    }, []);

    return {
        reminders: meals.map(meal => ({
            key: meal.key,
            enabled: meal.enabled,
            expanded: meal.expanded,
            time: `${meal.hour}:${pad(meal.minute)}`,
        })),
        // TODO: the next weigh-in date comes from the server once it schedules them.
        weighIn: { enabled: weighInEnabled, nextDate: '23 жовтня 2026' },
        toggle,
        toggleExpanded,
        timeColumnsFor,
        handleClose,
        handleSave,
    };
};
