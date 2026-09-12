import { useCallback, useMemo, useState } from 'react';

import { usePreventRemove } from '@react-navigation/native';
import { router, useNavigation } from 'expo-router';

import type { MacroKey } from '@/shared/ui/components';
import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useGetNutritionGoal, useUpsertNutritionGoal } from '@/state/domains/nutrition';
import { useGetProgressMetrics } from '@/state/domains/progress';
import { useGetOnboarding, useGetRecommendations } from '@/state/domains/user';
import { CALORIE_GOAL_TOLERANCE } from '@/view/onboarding/onboarding.constants';

import type { GoalParam, MacroBalanceSegment } from './components';

export type GoalKey = 'loss' | 'maintain' | 'gain';
export type NutrientKey = MacroKey | 'water' | 'fiber';

/** Only used until the goal arrives — every real value comes from the server. */
const CALORIE_GOAL_FALLBACK = 1850;
const CALORIE_STEP = 50;
const CALORIE_MIN = 1000;
const CALORIE_MAX = 5000;

/**
 * The three presets the design shows.
 *
 * Still fixed numbers: the spec (FR-010) says they should follow the computed
 * norm once the profile can produce one, but the API has no «goal preset»
 * endpoint, and deriving them here would put a second implementation of the
 * formulas in the client — exactly what `TODO_BE.md` §1–3 is meant to prevent.
 */
const GOALS: { key: GoalKey; emoji: string; calories: number }[] = [
    { key: 'loss', emoji: '🔥', calories: 1400 },
    { key: 'maintain', emoji: '⚖️', calories: 1850 },
    { key: 'gain', emoji: '💪', calories: 2500 },
];

const NUTRIENTS: { key: NutrientKey; emoji: string; unit: 'g' | 'ml' }[] = [
    { key: 'protein', emoji: '🥩', unit: 'g' },
    { key: 'fats', emoji: '🫒', unit: 'g' },
    { key: 'carbs', emoji: '🌾', unit: 'g' },
    { key: 'water', emoji: '💧', unit: 'ml' },
    { key: 'fiber', emoji: '🥦', unit: 'g' },
];

const KCAL_PER_GRAM: Record<MacroKey, number> = {
    protein: 4,
    fats: 9,
    carbs: 4,
};

export const useGoalSetupScreen = () => {
    const { t } = useAppTranslation(['tracking', 'common']);

    const navigation = useNavigation();

    const { data: goal } = useGetNutritionGoal();
    const { data: recommendations } = useGetRecommendations();
    const { data: onboarding } = useGetOnboarding();
    const { data: cards } = useGetProgressMetrics();
    const upsertGoal = useUpsertNutritionGoal();

    const savedCalories = goal?.dailyCalories ?? CALORIE_GOAL_FALLBACK;
    // Правка живе локально, доки її не збережено; поки цілі нема — поле
    // порожнє, і як тільки вона доїде, беремо збережене значення.
    const [draftCalories, setDraftCalories] = useState<number | null>(null);
    const calories = draftCalories ?? savedCalories;

    const nudgeCalories = useCallback(
        (step: number) =>
            setDraftCalories(prev => Math.min(Math.max((prev ?? savedCalories) + step, CALORIE_MIN), CALORIE_MAX)),
        [savedCalories],
    );

    const values = useMemo<Record<NutrientKey, number>>(
        () => ({
            protein: goal?.dailyProteinG ?? 0,
            fats: goal?.dailyFatsG ?? 0,
            carbs: goal?.dailyCarbsG ?? 0,
            water: goal?.dailyWaterMl ?? 0,
            fiber: goal?.dailyFiberG ?? 0,
        }),
        [goal],
    );

    // Leaving with unsaved changes asks first (811:37310).
    const isDirty = draftCalories !== null && draftCalories !== savedCalories;
    const [pendingExit, setPendingExit] = useState<(() => void) | null>(null);

    usePreventRemove(isDirty, ({ data }) => {
        setPendingExit(() => () => navigation.dispatch(data.action));
    });

    const selectedGoal = useMemo(() => GOALS.find(goal => goal.calories === calories)?.key, [calories]);

    const handleChangeParam = useCallback((key: string) => {
        // Weight and height reuse the reading sheets (811:37541, 811:39327);
        // activity has its own (984:58347).
        if (key === 'activity') {
            router.push('/(app)/activity-edit');
            return;
        }
        router.push({ pathname: '/(app)/metric-add', params: { metric: key, mode: 'reading' } });
    }, []);

    const params = useMemo(() => {
        const build = (key: string, label: string, value: string): GoalParam => ({
            key,
            label,
            value,
            onPress: () => handleChangeParam(key),
        });

        // Вага й зріст — останні показання; якщо їх ще нема, беремо відповіді
        // анкети: це те саме вимірювання, зняте на етапі налаштування.
        const weight = cards?.find(card => card.metric === 'weight')?.current ?? onboarding?.weightKg ?? null;
        const height = cards?.find(card => card.metric === 'height')?.current ?? onboarding?.heightCm ?? null;
        const level = onboarding?.activityLevel ?? null;

        return {
            pair: [
                build(
                    'weight',
                    t('tracking:goal-setup.params.weight'),
                    weight === null ? '—' : t('tracking:goal-setup.params.kg', { value: weight.toFixed(1) }),
                ),
                build(
                    'height',
                    t('tracking:goal-setup.params.height'),
                    height === null ? '—' : t('tracking:goal-setup.params.cm', { value: Math.round(height) }),
                ),
            ] as [GoalParam, GoalParam],
            full: build(
                'activity',
                t('tracking:goal-setup.params.activity'),
                level === null
                    ? '—'
                    : t(`onboarding:setup.activity.levels.${level - 1}`, { defaultValue: '' }) || String(level),
            ),
        };
    }, [cards, onboarding, t, handleChangeParam]);

    const nutrients = useMemo(
        () => NUTRIENTS.map(nutrient => ({ ...nutrient, value: values[nutrient.key] })),
        [values],
    );

    /** Every macro's slice of the macro calories — the three always sum to 100%. */
    const balanceSegments = useMemo<MacroBalanceSegment[]>(() => {
        const kcal = {
            protein: values.protein * KCAL_PER_GRAM.protein,
            fats: values.fats * KCAL_PER_GRAM.fats,
            carbs: values.carbs * KCAL_PER_GRAM.carbs,
        };
        const total = Math.max(kcal.protein + kcal.fats + kcal.carbs, 1);

        return (Object.keys(kcal) as MacroKey[]).map(key => ({ key, share: kcal[key] / total }));
    }, [values]);

    const handleSelectGoal = useCallback((goal: GoalKey) => {
        const preset = GOALS.find(item => item.key === goal);
        if (preset) setDraftCalories(preset.calories);
    }, []);

    const handleDecreaseCalories = useCallback(() => nudgeCalories(-CALORIE_STEP), [nudgeCalories]);

    const handleIncreaseCalories = useCallback(() => nudgeCalories(CALORIE_STEP), [nudgeCalories]);

    const handleChangeNutrient = useCallback(
        (key: NutrientKey) => {
            // Fibre is the one row the design never drew a sheet for.
            if (key === 'fiber') {
                ToastService.info(t('common:states.coming-soon'));
                return;
            }
            router.push({ pathname: '/(app)/metric-add', params: { metric: key, mode: 'goal' } });
        },
        [t],
    );

    const commit = useCallback(
        (onDone?: () => void) => {
            if (upsertGoal.isPending) return;

            // Ціль зберігається цілком — екран має одну дію збереження, і
            // часткове тіло лишило б її наполовину старою.
            upsertGoal.mutate(
                {
                    dailyCalories: Math.round(calories),
                    dailyProteinG: Math.round(values.protein),
                    dailyFatsG: Math.round(values.fats),
                    dailyCarbsG: Math.round(values.carbs),
                    dailyWaterMl: Math.round(values.water),
                    dailyFiberG: Math.round(values.fiber),
                },
                {
                    onSuccess: () => {
                        setDraftCalories(null);
                        ToastService.success(t('tracking:goal-setup.saved'));
                        onDone?.();
                    },
                    onError: () => ToastService.error(t('common:states.error')),
                },
            );
        },
        [calories, t, upsertGoal, values],
    );

    const handleSave = useCallback(() => {
        commit(() => {
            if (router.canGoBack()) router.back();
        });
    }, [commit]);

    /** «Зберегти зміни» in the sheet: save, then continue leaving. */
    const handleConfirmExit = useCallback(() => {
        const leave = pendingExit;
        setPendingExit(null);
        commit(() => leave?.());
    }, [commit, pendingExit]);

    /** «Продовжити без змін»: drop the edits and leave. */
    const handleDiscardExit = useCallback(() => {
        const leave = pendingExit;
        setPendingExit(null);
        setDraftCalories(null);
        leave?.();
    }, [pendingExit]);

    /** The × and the scrim: stay on the screen. */
    const handleDismissExit = useCallback(() => setPendingExit(null), []);

    /**
     * Where the chosen target sits against the computed norm: a corridor of
     * ±600 kcal (owner, 12.09). Outside it the stepper reads as a warning —
     * `null` while there is no recommendation to compare against.
     */
    const recommended = recommendations?.calories ?? null;
    const calorieDrift: 'low' | 'high' | 'ok' | null =
        recommended === null
            ? null
            : calories < recommended - CALORIE_GOAL_TOLERANCE
              ? 'low'
              : calories > recommended + CALORIE_GOAL_TOLERANCE
                ? 'high'
                : 'ok';

    return {
        params,
        goals: GOALS,
        selectedGoal,
        calories,
        recommended,
        calorieDrift,
        isSaving: upsertGoal.isPending,
        balanceSegments,
        nutrients,
        handleSelectGoal,
        handleDecreaseCalories,
        handleIncreaseCalories,
        handleChangeNutrient,
        handleSave,
        isExitPending: pendingExit !== null,
        handleConfirmExit,
        handleDiscardExit,
        handleDismissExit,
    };
};
