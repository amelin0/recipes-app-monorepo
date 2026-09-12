import { useMemo, useState } from 'react';

import { router } from 'expo-router';

import { useDebouncedValue } from '@/shared/hooks';
import { useGetProducts } from '@/state/domains/catalog';

export const useAddProductScreen = () => {
    const [query, setQuery] = useState('');
    // Пошук на сервері: каталог більший за сторінку, тож фільтрувати вже
    // завантажене означало б шукати лише серед перших двадцяти.
    const search = useDebouncedValue(query.trim(), 300);

    const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetProducts(
        search ? { q: search } : {},
    );

    const products = useMemo(() => data?.pages.flatMap(page => page.data) ?? [], [data]);

    return {
        query,
        setQuery,
        products,
        isLoading,
        isError,
        isEmpty: !isLoading && !isError && products.length === 0,
        handleRetry: refetch,
        handleEndReached: () => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
        },
        handleProductPress: (productId: string) =>
            router.push({ pathname: '/(app)/product-amount', params: { productId } }),
    };
};
