import { useCallback, useMemo, useState } from 'react';

import { router } from 'expo-router';

import type { WheelPickerColumn } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';

import { BIRTH_YEAR_MAX, BIRTH_YEAR_MIN, DEFAULT_BIRTH_DATE } from '../onboarding.constants';

const pad = (value: number) => String(value).padStart(2, '0');

/** Days in a month, honouring leap years so 29 Feb stays reachable. */
const daysInMonth = (year: number, monthIndex: number) => new Date(year, monthIndex + 1, 0).getDate();

export const useSetupBirthDateScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const stored = useStore(state => state.profileSetup.birthDate);
    const setAnswer = useStore(state => state.setProfileSetupAnswerAction);

    const initial = useMemo(() => {
        const [year, month, day] = (stored ?? DEFAULT_BIRTH_DATE).split('-').map(Number);
        const [fallbackYear, fallbackMonth, fallbackDay] = DEFAULT_BIRTH_DATE.split('-').map(Number);
        return {
            year: year ?? fallbackYear!,
            monthIndex: (month ?? fallbackMonth!) - 1,
            day: day ?? fallbackDay!,
        };
    }, [stored]);

    const [monthIndex, setMonthIndex] = useState(initial.monthIndex);
    const [day, setDay] = useState(initial.day);
    const [year, setYear] = useState(initial.year);

    const months = useMemo(
        () => (t('onboarding:setup.birth-date.months', { returnObjects: true }) as string[]) ?? [],
        [t],
    );
    const years = useMemo(
        () => Array.from({ length: BIRTH_YEAR_MAX - BIRTH_YEAR_MIN + 1 }, (_, i) => BIRTH_YEAR_MIN + i),
        [],
    );
    const days = useMemo(
        () => Array.from({ length: daysInMonth(year, monthIndex) }, (_, i) => i + 1),
        [year, monthIndex],
    );

    const commit = useCallback(
        (nextYear: number, nextMonthIndex: number, nextDay: number) => {
            // Clamp first: moving off a 31-day month must not leave an invalid day.
            const clampedDay = Math.min(nextDay, daysInMonth(nextYear, nextMonthIndex));
            setYear(nextYear);
            setMonthIndex(nextMonthIndex);
            setDay(clampedDay);
            setAnswer('birthDate', `${nextYear}-${pad(nextMonthIndex + 1)}-${pad(clampedDay)}`);
        },
        [setAnswer],
    );

    const columns: WheelPickerColumn[] = [
        {
            key: 'month',
            items: months,
            selectedIndex: monthIndex,
            onChange: index => commit(year, index, day),
        },
        {
            key: 'day',
            items: days.map(String),
            selectedIndex: days.indexOf(day),
            onChange: index => commit(year, monthIndex, days[index] ?? day),
        },
        {
            key: 'year',
            items: years.map(String),
            selectedIndex: years.indexOf(year),
            onChange: index => commit(years[index] ?? year, monthIndex, day),
        },
    ];

    const handleNext = useCallback(() => {
        // Nothing further is designed yet — persist and stop here.
        setAnswer('birthDate', `${year}-${pad(monthIndex + 1)}-${pad(day)}`);
        router.push('/(app)/(tabs)/home');
    }, [day, monthIndex, setAnswer, year]);

    return { columns, canProceed: true, handleNext };
};
