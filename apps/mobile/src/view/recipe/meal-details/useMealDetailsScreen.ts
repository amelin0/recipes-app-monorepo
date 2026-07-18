import { useCallback, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

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

    const [activeTab, setActiveTab] = useState<MealDetailsTab>('ingredients');
    const [isFavorite, setIsFavorite] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);

    const handleStepScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>, cardWidth: number) => {
        if (cardWidth <= 0) return;
        const index = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
        setStepIndex(Math.min(Math.max(index, 0), MOCK_MEAL_DETAIL.steps.length - 1));
    }, []);

    const showComingSoon = useCallback(() => {
        ToastService.info(t('common:states.coming-soon'));
    }, [t]);

    return {
        meal,
        activeTab,
        setActiveTab: (key: string) => setActiveTab(key as MealDetailsTab),
        isFavorite,
        stepIndex,
        handleStepScroll,
        // TODO: PUT /recipes/:id/favorite once the API ships.
        handleToggleFavorite: () => setIsFavorite(prev => !prev),
        handleEdit: showComingSoon,
        handleShare: showComingSoon,
        handleAddToShoppingList: showComingSoon,
        handleAddToRation: showComingSoon,
        handlePortionsPress: showComingSoon,
        handleCookPress: () => router.push('/(app)/meal-portions'),
    };
};
