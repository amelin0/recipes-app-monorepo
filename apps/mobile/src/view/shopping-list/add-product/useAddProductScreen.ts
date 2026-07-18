import { useMemo, useState } from 'react';

import { router } from 'expo-router';

import { formatDayHeaderAccusative } from '@/shared/helpers';
import { useAppTranslation } from '@/shared/utils/translations';

import { PRODUCT_CATALOG } from '../shopping.constants';

export const useAddProductScreen = () => {
    const { t } = useAppTranslation(['shopping']);
    const [query, setQuery] = useState('');

    const products = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        const withNames = PRODUCT_CATALOG.map(product => ({
            ...product,
            name: t(`shopping:products.${product.key}`),
        }));
        if (!normalized) return withNames;
        return withNames.filter(product => product.name.toLowerCase().includes(normalized));
    }, [query, t]);

    return {
        subtitle: t('shopping:add.subtitle', { date: formatDayHeaderAccusative() }),
        query,
        setQuery,
        products,
        handleProductPress: (key: string) =>
            router.push({ pathname: '/(app)/product-amount', params: { productKey: key } }),
    };
};
