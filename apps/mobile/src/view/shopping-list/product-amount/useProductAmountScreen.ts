import { useCallback, useEffect, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';

import { AMOUNT_UNITS, PRODUCT_CATALOG, type AmountUnitKey } from '../shopping.constants';

// Без групування розрядів: «1 000» не пережив би parse (parseFloat → 1).
const formatValue = (value: number) => value.toLocaleString('uk-UA', { useGrouping: false });

const parseValue = (text: string) => {
    const parsed = Number.parseFloat(text.replace(/[\s  ]/g, '').replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
};

export const useProductAmountScreen = () => {
    const { t } = useAppTranslation(['shopping']);
    const { productKey } = useLocalSearchParams<{ productKey?: string }>();
    const addShoppingItem = useStore(state => state.addShoppingItem);

    const product = PRODUCT_CATALOG.find(candidate => candidate.key === productKey);

    const [unit, setUnit] = useState<AmountUnitKey>('gram');
    const [valueText, setValueText] = useState(() => formatValue(AMOUNT_UNITS.gram.initial));

    // Невалідний/відсутній productKey (діплінк, відновлений стан) — тихо
    // закриваємо шит замість показу першого-ліпшого продукту.
    useEffect(() => {
        if (!product && router.canGoBack()) router.back();
    }, [product]);

    const handleUnitChange = useCallback((key: string) => {
        const nextUnit = key as AmountUnitKey;
        setUnit(nextUnit);
        setValueText(formatValue(AMOUNT_UNITS[nextUnit].initial));
    }, []);

    const step = useCallback(
        (direction: 1 | -1) => {
            const config = AMOUNT_UNITS[unit];
            const current = parseValue(valueText);
            const next = Math.min(Math.max(current + direction * config.step, config.min), config.max);
            setValueText(formatValue(next));
        },
        [unit, valueText],
    );

    const handleAdd = useCallback(() => {
        if (!product) return;
        const config = AMOUNT_UNITS[unit];
        const value = Math.min(Math.max(parseValue(valueText), config.min), config.max);
        const grams = Math.round(value * config.grams);
        addShoppingItem({
            productKey: product.key,
            categoryKey: product.categoryKey,
            kcal: Math.round((product.kcalPer100 * grams) / 100),
            amount: grams,
            unit: 'g',
        });
        ToastService.success(t('shopping:amount.added-toast'));
        router.back();
    }, [addShoppingItem, product, t, unit, valueText]);

    return {
        product,
        title: product ? `${product.emoji} ${t(`shopping:products.${product.key}`)}` : '',
        unit,
        handleUnitChange,
        valueText,
        setValueText,
        suffix: t(`shopping:amount.suffix.${unit}`),
        handleDecrease: () => step(-1),
        handleIncrease: () => step(1),
        handleAdd,
        handleClose: () => router.back(),
    };
};
