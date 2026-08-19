import { useCallback, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';

import { MOCK_MEAL_DETAIL } from '../recipe.constants';

export type MealDetailsTab = 'ingredients' | 'method';

export const useMealDetailsScreen = () => {
    const { t } = useAppTranslation(['recipes', 'common']);
    // TODO: fetch by id (GET /recipes/:id) once the API ships.
    useLocalSearchParams<{ id?: string }>();
    const meal = MOCK_MEAL_DETAIL;

    // The method is what the screen opens on — the design puts that tab first.
    const [activeTab, setActiveTab] = useState<MealDetailsTab>('method');
    const [isFavorite, setIsFavorite] = useState(false);

    const showComingSoon = useCallback(() => {
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    return {
        meal,
        activeTab,
        setActiveTab: (key: string) => setActiveTab(key as MealDetailsTab),
        isFavorite,
        // TODO: PUT /recipes/:id/favorite once the API ships.
        handleToggleFavorite: () => setIsFavorite(prev => !prev),
        handleEdit: showComingSoon,
        handleShare: showComingSoon,
        handleAddToShoppingList: showComingSoon,
        // Logging a meal starts with how much of it was eaten.
        handleLogMeal: () => router.push('/(app)/meal-portions'),
    };
};
