import { useMemo, useState } from 'react';

import { router } from 'expo-router';

import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';

import { INGREDIENT_CATALOG } from '../recipe.constants';

/**
 * The sheet edits a draft of the `ingredients` filter group: «Застосувати»
 * commits it, closing any other way discards it (626:21538).
 */
export const useFilterIngredientsScreen = () => {
    const { t } = useAppTranslation(['recipes']);
    const ingredients = useStore(state => state.recipeFilters.ingredients);
    const setRecipeFilterGroup = useStore(state => state.setRecipeFilterGroup);

    const [draft, setDraft] = useState<string[]>(ingredients);
    const [query, setQuery] = useState('');

    const normalized = query.trim().toLowerCase();
    const catalog = useMemo(
        () =>
            normalized.length === 0
                ? INGREDIENT_CATALOG
                : INGREDIENT_CATALOG.filter(key => t(`recipes:ingredients.${key}`).toLowerCase().includes(normalized)),
        [normalized, t],
    );

    return {
        catalog,
        query,
        setQuery,
        selectedCount: draft.length,
        isSelected: (key: string) => draft.includes(key),
        handleToggle: (key: string) =>
            setDraft(prev => (prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key])),
        handleClear: () => setQuery(''),
        handleClose: () => {
            if (router.canGoBack()) router.back();
        },
        handleApply: () => {
            setRecipeFilterGroup('ingredients', draft);
            if (router.canGoBack()) router.back();
        },
    };
};
