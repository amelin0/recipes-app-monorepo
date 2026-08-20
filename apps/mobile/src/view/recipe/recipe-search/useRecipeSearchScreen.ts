import { useCallback, useMemo, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';

interface IngredientResult {
    id: string;
    title: string;
    subtitle: string;
    protein: number;
    fats: number;
    carbs: number;
}

interface DishResult {
    id: string;
    title: string;
    emoji: string;
    thumbBg: string;
    kcal: number;
    protein: number;
    fats: number;
    carbs: number;
}

// TODO: replace with API search (recipe + product domains).
const MOCK_INGREDIENTS: IngredientResult[] = [
    { id: 'ing-1', title: 'Банан', subtitle: '1 шт(89г) 350 ккал', protein: 150, fats: 0, carbs: 30 },
];

const MOCK_DISHES: DishResult[] = [
    {
        id: 'dish-1',
        title: 'Банановий пиріг',
        emoji: '🍰',
        thumbBg: '#FCE8E8',
        kcal: 400,
        protein: 150,
        fats: 0,
        carbs: 30,
    },
];

const MOCK_CATEGORY_DISHES: DishResult[] = [
    {
        id: 'cat-1',
        title: 'Грецький салат',
        emoji: '🥗',
        thumbBg: '#FCE8E8',
        kcal: 350,
        protein: 150,
        fats: 0,
        carbs: 30,
    },
    {
        id: 'cat-2',
        title: 'Смажений лосось',
        emoji: '🐟',
        thumbBg: '#E8F1FC',
        kcal: 389,
        protein: 150,
        fats: 120,
        carbs: 30,
    },
    {
        id: 'cat-3',
        title: 'Рис з овочами та куркою',
        emoji: '🍛',
        thumbBg: '#FCF3E8',
        kcal: 420,
        protein: 180,
        fats: 90,
        carbs: 50,
    },
    {
        id: 'cat-4',
        title: 'Стейк зі свинини',
        emoji: '🥩',
        thumbBg: '#FCE8EE',
        kcal: 500,
        protein: 220,
        fats: 160,
        carbs: 10,
    },
    {
        id: 'cat-5',
        title: 'Гарбузовий суп-пюре',
        emoji: '🍲',
        thumbBg: '#F0FCE8',
        kcal: 250,
        protein: 50,
        fats: 15,
        carbs: 40,
    },
    {
        id: 'cat-6',
        title: 'Паста з соусом песто',
        emoji: '🍝',
        thumbBg: '#FCF3E8',
        kcal: 480,
        protein: 120,
        fats: 180,
        carbs: 60,
    },
];

export const useRecipeSearchScreen = () => {
    const { t } = useAppTranslation();
    const { category, rail } = useLocalSearchParams<{ category?: string; rail?: string }>();
    const [query, setQuery] = useState('');

    const normalized = query.trim().toLowerCase();

    const ingredientResults = useMemo(
        () => MOCK_INGREDIENTS.filter(item => item.title.toLowerCase().includes(normalized)),
        [normalized],
    );

    const dishResults = useMemo(() => {
        if (category) return MOCK_CATEGORY_DISHES;
        return MOCK_DISHES.filter(dish => dish.title.toLowerCase().includes(normalized));
    }, [category, normalized]);

    const handleResultPress = useCallback(
        (_id: string) => {
            // TODO: product details once designed.
            ToastService.info(t('common:states.coming-soon'));
        },
        [t],
    );

    const handleDishPress = useCallback((id: string) => {
        router.push({ pathname: '/(app)/meal-details', params: { id } });
    }, []);

    return {
        categoryKey: category,
        /** The dish-type rail and the search grid run different taxonomies for now. */
        categoryLabelKey: category
            ? rail
                ? `recipes:rail-categories.${category}`
                : `recipes:categories.${category}`
            : undefined,
        query,
        setQuery,
        ingredientResults,
        dishResults,
        handleClear: () => setQuery(''),
        handleCategoryPress: (key: string) =>
            router.push({ pathname: '/(app)/recipe-search', params: { category: key } }),
        handleFilterPress: () => router.push('/(app)/recipes-filter'),
        handleResultPress,
        handleDishPress,
    };
};
