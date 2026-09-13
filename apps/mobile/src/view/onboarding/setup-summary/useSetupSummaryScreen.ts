import { useCallback, useMemo } from 'react';

import { router } from 'expo-router';

import { formatThousands } from '@/shared/helpers';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';
import { useGetRecommendations } from '@/state/domains/user';

import type { MacroChip } from './components';

export const useSetupSummaryScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const profile = useStore(state => state.profileSetup);
    const { data: recommendations } = useGetRecommendations();

    // Макроси рахує сервер із тих самих відповідей, що й калорії — власного
    // розрахунку тут немає навмисно, інакше клієнт і бекенд показували б
    // дві різні норми для одного профілю.
    const macros: MacroChip[] = useMemo(
        () => [
            {
                key: 'protein',
                letter: t('onboarding:setup.summary.macro-protein'),
                value: t('onboarding:setup.summary.macro-grams', { value: recommendations?.proteinG ?? 0 }),
            },
            {
                key: 'fat',
                letter: t('onboarding:setup.summary.macro-fat'),
                value: t('onboarding:setup.summary.macro-grams', { value: recommendations?.fatsG ?? 0 }),
            },
            {
                key: 'carbs',
                letter: t('onboarding:setup.summary.macro-carbs'),
                value: t('onboarding:setup.summary.macro-grams', { value: recommendations?.carbsG ?? 0 }),
            },
        ],
        [recommendations, t],
    );

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
            value: formatThousands(profile.calorieGoal ?? recommendations?.calories ?? 0),
        }),
        macros,
        water: t('onboarding:setup.summary.water', {
            value: formatThousands(profile.waterGoalMl ?? recommendations?.waterMl ?? 0),
        }),
        steps: t('onboarding:setup.summary.steps', {
            value: formatThousands(profile.stepsGoal ?? recommendations?.steps ?? 0),
        }),
        handleEdit,
        handleStart,
    };
};
