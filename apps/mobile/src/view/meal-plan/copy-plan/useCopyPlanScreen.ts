import { useCallback, useMemo, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import { formatFullDate, fromIsoDay, shiftIsoDay, toIsoDay } from '@/shared/helpers';
import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { resolvePlanDate, useCopyPlanDay } from '@/state/domains/meal-plan';

export type CopyWeekTab = 'this' | 'next';

/** Two weeks of targets, as the day strip offers. */
const DAYS_AHEAD = 13;

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const useCopyPlanScreen = () => {
    const { t } = useAppTranslation(['meal-plan']);
    const params = useLocalSearchParams<{ day?: string }>();

    /** The day being copied FROM — the sheet says so, so the target list reads unambiguously. */
    const sourceDate = resolvePlanDate(params.day);
    const copyDay = useCopyPlanDay();

    const [activeTab, setActiveTab] = useState<CopyWeekTab>('this');
    const [selected, setSelected] = useState<string[]>([]);

    const today = useMemo(() => toIsoDay(), []);

    /**
     * Every day from today forward, minus the one being copied.
     *
     * Today is offered too: copying an earlier day onto today is a real thing
     * to want, and it carries an extra label so it is not mistaken for a date
     * further out (owner's request).
     */
    const allDays = useMemo(
        () =>
            Array.from({ length: DAYS_AHEAD + 1 }, (_, offset) => shiftIsoDay(today, offset))
                .filter(date => date !== sourceDate)
                .map(date => {
                    const at = fromIsoDay(date);
                    return {
                        key: date,
                        name: capitalize(new Intl.DateTimeFormat('uk-UA', { weekday: 'long' }).format(at)),
                        date: new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long' }).format(at),
                        isToday: date === today,
                    };
                }),
        [sourceDate, today],
    );

    // «Цей тиждень» — найближчі сім днів, «Наступний» — решта вікна.
    const days = useMemo(() => (activeTab === 'this' ? allDays.slice(0, 7) : allDays.slice(7)), [activeTab, allDays]);

    const handleApply = useCallback(() => {
        if (selected.length === 0 || copyDay.isPending) return;

        copyDay.mutate(
            { date: sourceDate, targetDates: selected },
            {
                onSuccess: () => {
                    if (router.canGoBack()) router.back();
                    ToastService.success(t('meal-plan:copy.copied'));
                },
                onError: () => ToastService.error(t('common:states.error')),
            },
        );
    }, [copyDay, selected, sourceDate, t]);

    return {
        activeTab,
        setActiveTab: (key: string) => setActiveTab(key as CopyWeekTab),
        days,
        /** «Копіювати з 12 вересня 2026» — what the sheet is copying from. */
        sourceLabel: t('meal-plan:copy.source', { date: formatFullDate(fromIsoDay(sourceDate)) }),
        selected,
        canApply: selected.length > 0,
        isCopying: copyDay.isPending,
        handleToggle: (key: string) =>
            setSelected(prev => (prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key])),
        handleClose: () => {
            if (router.canGoBack()) router.back();
        },
        handleApply,
    };
};
