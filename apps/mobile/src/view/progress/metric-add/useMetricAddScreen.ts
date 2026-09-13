import { useCallback, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import type { MeasurableMetric, PatchGoalPayload } from '@/data';
import { formatThousands, toIsoDay } from '@/shared/helpers';
import { useActionLock } from '@/shared/hooks';
import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useGetDay, useGetNutritionGoal, usePatchNutritionGoal, useSetSteps } from '@/state/domains/nutrition';
import { useGetProgressMetrics, useRecordMeasurement } from '@/state/domains/progress';
import { useGetOnboarding, useGetProfile, useUpdateProfile } from '@/state/domains/user';

import {
    GOAL_METRIC_CONFIG,
    READING_METRIC_CONFIG,
    MACRO_GOAL_METRICS,
    type GoalMetricKey,
    type ReadingMetricKey,
} from '../progress.constants';

/** Which line of the nutrition goal each goal metric writes. */
const GOAL_FIELD: Record<Exclude<GoalMetricKey, 'weight'>, keyof PatchGoalPayload> = {
    steps: 'dailyStepsTarget',
    water: 'dailyWaterMl',
    protein: 'dailyProteinG',
    fats: 'dailyFatsG',
    carbs: 'dailyCarbsG',
};

/** Editing a reading you took, or the goal you are aiming at. */
export type MetricEntryMode = 'reading' | 'goal';

/**
 * «78,2» — the design writes fractional readings with a decimal comma
 * (673:41675) and groups whole ones in thousands, «5,000» (673:50419). The two
 * never collide: only weight has decimals, and it never reaches four digits.
 */
const toDisplay = (value: number, precision: number) =>
    precision > 0 ? value.toFixed(precision).replace('.', ',') : formatThousands(value);
const toNumber = (text: string) => Number(text.replace(/,(?=\d{3}\b)/g, '').replace(',', '.'));

export const useMetricAddScreen = () => {
    const { t } = useAppTranslation(['common']);
    const {
        metric = 'weight',
        mode = 'reading',
        from,
    } = useLocalSearchParams<{
        metric?: ReadingMetricKey | GoalMetricKey;
        mode?: MetricEntryMode;
        /** Which tab the receipt should return to; the progress tab by default. */
        from?: string;
    }>();

    const isGoal = mode === 'goal';
    const isMacroGoal = isGoal && (MACRO_GOAL_METRICS as readonly string[]).includes(metric);
    const config = isGoal
        ? GOAL_METRIC_CONFIG[metric as GoalMetricKey]
        : READING_METRIC_CONFIG[metric as ReadingMetricKey];

    const { data: cards } = useGetProgressMetrics();
    const { data: goal } = useGetNutritionGoal();
    const { data: profile } = useGetProfile();
    const { data: onboarding } = useGetOnboarding();

    const today = toIsoDay();
    // Кроки — денний підсумок, а не вимір: сьогоднішнє значення живе в зрізі
    // дня, і саме воно має стояти в полі, бо PUT замінює його, а не додає.
    const { data: day } = useGetDay(today, { enabled: !isGoal && metric === 'steps' });

    const recordMeasurement = useRecordMeasurement();
    const setSteps = useSetSteps();
    const patchGoal = usePatchNutritionGoal();
    const updateProfile = useUpdateProfile();

    /**
     * What the field opens on: the goal being edited, or the latest reading.
     *
     * With no reading yet, the questionnaire's answer stands in — it is the
     * same measurement, taken during setup. The middle of the allowed range is
     * the last resort; opening on «0 кг» would ask the user to scroll up from
     * nothing.
     */
    const middle = Math.round((config.min + config.max) / 2);
    const lastReading = cards?.find(card => card.metric === metric)?.current ?? null;
    const fromQuestionnaire =
        metric === 'weight'
            ? (onboarding?.weightKg ?? null)
            : metric === 'height'
              ? (onboarding?.heightCm ?? null)
              : null;

    const current = isGoal
        ? metric === 'weight'
            ? (profile?.targetWeightKg ?? middle)
            : (goal?.[GOAL_FIELD[metric as Exclude<GoalMetricKey, 'weight'>]] ?? middle)
        : metric === 'steps'
          ? (day?.steps ?? 0)
          : (lastReading ?? fromQuestionnaire ?? middle);

    // expo-router reuses this screen when the same route is opened with
    // different params, so the field is keyed to what it is editing rather than
    // seeded once.
    const entryKey = `${metric}:${mode}`;
    const [entry, setEntry] = useState(() => ({ key: entryKey, value: toDisplay(current, config.precision) }));
    if (entry.key !== entryKey) setEntry({ key: entryKey, value: toDisplay(current, config.precision) });

    const value = entry.value;
    const setValue = useCallback((next: string) => setEntry({ key: entryKey, value: next }), [entryKey]);

    const nudge = useCallback(
        (direction: 1 | -1) => {
            const next = toNumber(value) + direction * config.step;
            if (Number.isNaN(next)) return;
            setValue(toDisplay(Math.min(Math.max(next, config.min), config.max), config.precision));
        },
        [config, value],
    );

    const parsed = toNumber(value);
    const isValid = !Number.isNaN(parsed) && parsed >= config.min && parsed <= config.max;

    const isSaving =
        recordMeasurement.isPending || setSteps.isPending || patchGoal.isPending || updateProfile.isPending;

    const finish = useCallback(() => {
        if (isMacroGoal) {
            // A macro goal belongs to the goal screen that opened this sheet —
            // it has no receipt of its own (811:40272).
            router.back();
            return;
        }
        router.replace({ pathname: '/(app)/metric-updated', params: { metric, value, mode, from } });
    }, [from, isMacroGoal, metric, mode, value]);

    // Один замок на всі чотири мутації за цією кнопкою. Успіх веде на
    // квитанцію, тож відпускаємо лише на помилці.
    const lock = useActionLock();

    const handleSave = useCallback(() => {
        if (!isValid || !lock.acquire()) return;

        const onError = () => {
            ToastService.error(t('common:states.error'));
            lock.release();
        };

        if (!isGoal && metric === 'steps') {
            // Кроки пишуться в день, а не в таблицю вимірів: ендпоінт вимірів
            // відповідає 422 на щоденний показник у шляху.
            setSteps.mutate({ date: today, steps: Math.round(parsed) }, { onSuccess: finish, onError });
            return;
        }

        if (!isGoal) {
            // Дату називає пристрій, а не сервер: о 00:43 за Києвом на сервері
            // ще вчора, і зважування, зроблене «сьогодні», лягало вчорашнім
            // днем — квитанція казала 13-те, а графік малював 12-те.
            recordMeasurement.mutate(
                { metric: metric as MeasurableMetric, value: parsed, measuredOn: today },
                { onSuccess: finish, onError },
            );
            return;
        }

        if (metric === 'weight') {
            // Цільова вага живе в профілі, а не в денній нормі.
            updateProfile.mutate({ targetWeightKg: parsed }, { onSuccess: finish, onError });
            return;
        }

        // Одну лінію норми за раз: надсилати всю ціль заради однієї цифри
        // означало б перетерти решту тим, що екран востаннє прочитав.
        patchGoal.mutate(
            { [GOAL_FIELD[metric as Exclude<GoalMetricKey, 'weight'>]]: Math.round(parsed) },
            { onSuccess: finish, onError },
        );
    }, [
        finish,
        isGoal,
        lock,
        isValid,
        metric,
        parsed,
        patchGoal,
        recordMeasurement,
        setSteps,
        t,
        today,
        updateProfile,
    ]);

    return {
        metric,
        mode,
        isGoal,
        /** The water and macro goals quote the current target in their copy. */
        subtitleParams: { value: formatThousands(Math.round(current)) },
        value,
        setValue,
        isValid,
        isSaving: isSaving || lock.isBusy(),
        canDecrease: !Number.isNaN(parsed) && parsed > config.min,
        handleDecrease: () => nudge(-1),
        handleIncrease: () => nudge(1),
        handleClose: () => router.back(),
        handleSave,
    };
};
