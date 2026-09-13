import { useMemo, useState } from 'react';

import { router } from 'expo-router';

import { useDebouncedValue } from '@/shared/hooks';
import { useStore } from '@/state';
import { useGetProducts } from '@/state/domains/catalog';

/**
 * The sheet edits a draft of the `products` filter group: «Застосувати»
 * commits it, closing any other way discards it (626:21538).
 *
 * The catalogue is searched server-side rather than filtered in place — it
 * runs to hundreds of products, and paging them all down to filter locally
 * would cost more than the search does.
 */
export const useFilterIngredientsScreen = () => {
    const selected = useStore(state => state.recipeFilters.products);
    const setRecipeFilterGroup = useStore(state => state.setRecipeFilterGroup);

    const [draft, setDraft] = useState<string[]>(selected);
    const [query, setQuery] = useState('');
    const search = useDebouncedValue(query.trim(), 300);

    const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetProducts(
        search ? { q: search } : {},
    );

    const catalog = useMemo(() => data?.pages.flatMap(page => page.data) ?? [], [data]);

    return {
        catalog,
        isLoading,
        isError,
        isEmpty: !isLoading && !isError && catalog.length === 0,
        handleRetry: refetch,
        handleEndReached: () => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
        },
        query,
        setQuery,
        selectedCount: draft.length,
        isSelected: (id: string) => draft.includes(id),
        handleToggle: (id: string) =>
            setDraft(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id])),
        handleClear: () => setQuery(''),
        handleClose: () => {
            if (router.canGoBack()) router.back();
        },
        handleApply: () => {
            setRecipeFilterGroup('products', draft);
            if (router.canGoBack()) router.back();
        },
    };
};
