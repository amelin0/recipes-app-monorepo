import { useCallback } from 'react';

import { router } from 'expo-router';

import { formatThousands } from '@/shared/helpers';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';

import type { MacroChip } from './components';

export const useSetupSummaryScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const profile = useStore(state => state.profileSetup);

    // TODO: macros come from the API alongside the calorie recommendation.
    const macros: MacroChip[] = [
        { key: 'protein', letter: t('onboarding:setup.summary.macro-protein'), value: '100г' },
        { key: 'fat', letter: t('onboarding:setup.summary.macro-fat'), value: '100г' },
        { key: 'carbs', letter: t('onboarding:setup.summary.macro-carbs'), value: '100г' },
    ];

    const handleEdit = useCallback(() => {
        // Back into the questionnaire at its first question.
        router.dismissTo('/(app)/setup-name');
    }, []);

    const handleStart = useCallback(() => {
        router.push('/(app)/setup-notifications');
    }, []);

    return {
        name: profile.name,
        goalTitle: profile.goal ? t(`onboarding:setup.goal.options.${profile.goal}.short`) : '',
        targetWeight: profile.targetWeightKg
            ? t('onboarding:setup.summary.target-weight', { value: Math.round(profile.targetWeightKg) })
            : '',
        calories: t('onboarding:setup.summary.calories', {
            value: formatThousands(profile.calorieGoal ?? 0),
        }),
        macros,
        water: t('onboarding:setup.summary.water', { value: formatThousands(profile.waterGoalMl ?? 0) }),
        steps: t('onboarding:setup.summary.steps', { value: formatThousands(profile.stepsGoal ?? 0) }),
        handleEdit,
        handleStart,
    };
};
