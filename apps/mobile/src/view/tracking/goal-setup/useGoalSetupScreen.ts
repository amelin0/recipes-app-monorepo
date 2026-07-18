import { useCallback, useMemo, useState } from 'react';

import { router } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';

import type { MacroBalanceSegment } from './components';

export type GoalKey = 'loss' | 'maintain' | 'gain';
export type NutrientKey = 'protein' | 'fats' | 'carbs' | 'water' | 'fiber';

const CALORIE_STEP = 50;
const CALORIE_MIN = 1000;
const CALORIE_MAX = 5000;

const GOALS: { key: GoalKey; emoji: string; calories: number }[] = [
    { key: 'loss', emoji: '🔥', calories: 1400 },
    { key: 'maintain', emoji: '⚖️', calories: 1850 },
    { key: 'gain', emoji: '💪', calories: 2500 },
];

const KCAL_PER_GRAM: Record<'protein' | 'fats' | 'carbs', number> = {
    protein: 4,
    fats: 9,
    carbs: 4,
};

export const useGoalSetupScreen = () => {
    const { t } = useAppTranslation(['tracking']);
    const { theme } = useUnistyles();

    // TODO: replace mocks with API data (nutrition domain).
    const params = { weight: '70 кг', height: '178см', activity: 'Середня активність' };

    const [calories, setCalories] = useState(1850);
    const [values, setValues] = useState<Record<NutrientKey, number>>({
        protein: 200,
        fats: 48,
        carbs: 100,
        water: 2000,
        fiber: 25,
    });

    const selectedGoal = useMemo(() => GOALS.find(goal => goal.calories === calories)?.key, [calories]);

    const nutrients = [
        {
            key: 'protein' as const,
            emoji: '🥩',
            value: values.protein,
            min: 40,
            max: 350,
            step: 5,
            unit: 'g' as const,
            color: theme.colors.semantic.negative,
        },
        {
            key: 'fats' as const,
            emoji: '🫒',
            value: values.fats,
            min: 20,
            max: 200,
            step: 2,
            unit: 'g' as const,
            color: theme.colors.semantic.positive,
        },
        {
            key: 'carbs' as const,
            emoji: '🌾',
            value: values.carbs,
            min: 30,
            max: 500,
            step: 5,
            unit: 'g' as const,
            color: theme.colors.semantic.ocean,
        },
        {
            key: 'water' as const,
            emoji: '💧',
            value: values.water,
            min: 500,
            max: 5000,
            step: 100,
            unit: 'ml' as const,
            color: theme.colors.semantic.ocean,
        },
        {
            key: 'fiber' as const,
            emoji: '🥦',
            value: values.fiber,
            min: 10,
            max: 60,
            step: 1,
            unit: 'g' as const,
            color: theme.colors.branding.accent,
        },
    ];

    const balanceSegments = useMemo<MacroBalanceSegment[]>(() => {
        const proteinKcal = values.protein * KCAL_PER_GRAM.protein;
        const fatsKcal = values.fats * KCAL_PER_GRAM.fats;
        const carbsKcal = values.carbs * KCAL_PER_GRAM.carbs;
        const total = Math.max(calories, proteinKcal + fatsKcal + carbsKcal, 1);
        const rest = Math.max(total - proteinKcal - fatsKcal - carbsKcal, 0);

        const segments: MacroBalanceSegment[] = [
            {
                key: 'protein',
                label: t('tracking:home.macros.protein'),
                share: proteinKcal / total,
                color: theme.colors.semantic.negative,
                badgeBg: theme.colors.semantic.lightNegative,
            },
            {
                key: 'fats',
                label: t('tracking:home.macros.fats'),
                share: fatsKcal / total,
                color: theme.colors.semantic.positive,
                badgeBg: theme.colors.semantic.lightPositive,
            },
            {
                key: 'carbs',
                label: t('tracking:home.macros.carbs'),
                share: carbsKcal / total,
                color: theme.colors.semantic.ocean,
                badgeBg: theme.colors.semantic.lightOcean,
            },
        ];

        // Unallocated calories — grey "ккал" segment first, as in Figma 435:12836.
        if (rest > 0) {
            segments.unshift({
                key: 'rest',
                label: t('tracking:goal-setup.kcal'),
                share: rest / total,
                color: theme.colors.semantic.darkGrey,
            });
        }
        return segments;
    }, [calories, values, t, theme]);

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

    const handleNutrientChange = useCallback((key: NutrientKey, value: number) => {
        setValues(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleChangeParams = useCallback(() => {
        // TODO: navigate to the profile/params flow once designed.
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    const handleSave = useCallback(() => {
        // TODO: PUT /nutrition/goal once the API ships — mock success.
        ToastService.success(t('tracking:goal-setup.saved'));
        if (router.canGoBack()) {
            router.back();
        }
    }, [t]);

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
        handleNutrientChange,
        handleChangeParams,
        handleSave,
    };
};
