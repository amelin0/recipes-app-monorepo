import { useCallback, useMemo, useState } from 'react';

import { usePreventRemove } from '@react-navigation/native';
import { router, useNavigation } from 'expo-router';

import type { MacroKey } from '@/shared/ui/components';
import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';

import type { GoalParam, MacroBalanceSegment } from './components';

export type GoalKey = 'loss' | 'maintain' | 'gain';
export type NutrientKey = MacroKey | 'water' | 'fiber';

/** Where the questionnaire leaves the goal; TODO: read the saved one. */
const CALORIE_GOAL_DEFAULT = 1850;
const CALORIE_STEP = 50;
const CALORIE_MIN = 1000;
const CALORIE_MAX = 5000;

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

/**
 * TODO: replace with the saved goal (nutrition domain). How the macro grams
 * follow a calorie change is an open question — see the spec.
 */
const NUTRIENT_VALUES: Record<NutrientKey, number> = {
    protein: 200,
    fats: 48,
    carbs: 100,
    water: 2000,
    fiber: 25,
};

const KCAL_PER_GRAM: Record<MacroKey, number> = {
    protein: 4,
    fats: 9,
    carbs: 4,
};

export const useGoalSetupScreen = () => {
    const { t } = useAppTranslation(['tracking']);

    const navigation = useNavigation();

    const [savedCalories, setSavedCalories] = useState(CALORIE_GOAL_DEFAULT);
    const [calories, setCalories] = useState(CALORIE_GOAL_DEFAULT);
    const values = NUTRIENT_VALUES;

    // Leaving with unsaved changes asks first (811:37310).
    const isDirty = calories !== savedCalories;
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

        return {
            pair: [
                build('weight', t('tracking:goal-setup.params.weight'), '70 кг'),
                build('height', t('tracking:goal-setup.params.height'), '178 см'),
            ] as [GoalParam, GoalParam],
            full: build('activity', t('tracking:goal-setup.params.activity'), 'Середня активність'),
        };
    }, [t, handleChangeParam]);

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
        if (preset) setCalories(preset.calories);
    }, []);

    const handleDecreaseCalories = useCallback(() => {
        setCalories(prev => Math.max(prev - CALORIE_STEP, CALORIE_MIN));
    }, []);

    const handleIncreaseCalories = useCallback(() => {
        setCalories(prev => Math.min(prev + CALORIE_STEP, CALORIE_MAX));
    }, []);

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

    const commit = useCallback(() => {
        // TODO: PUT /nutrition/goal once the API ships — mock success.
        setSavedCalories(calories);
        ToastService.success(t('tracking:goal-setup.saved'));
    }, [calories, t]);

    const handleSave = useCallback(() => {
        commit();
        if (router.canGoBack()) {
            router.back();
        }
    }, [commit]);

    /** «Зберегти зміни» in the sheet: save, then continue leaving. */
    const handleConfirmExit = useCallback(() => {
        const leave = pendingExit;
        setPendingExit(null);
        commit();
        leave?.();
    }, [commit, pendingExit]);

    /** «Продовжити без змін»: drop the edits and leave. */
    const handleDiscardExit = useCallback(() => {
        const leave = pendingExit;
        setPendingExit(null);
        setCalories(savedCalories);
        leave?.();
    }, [pendingExit, savedCalories]);

    /** The × and the scrim: stay on the screen. */
    const handleDismissExit = useCallback(() => setPendingExit(null), []);

    return {
        params,
        goals: GOALS,
        selectedGoal,
        calories,
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
