import { useCallback, useEffect, useMemo, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';

import type { ShoppingUnit } from '@/data';
import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useGetProducts } from '@/state/domains/catalog';
import { useAddShoppingItem } from '@/state/domains/shopping-list';

import { AMOUNT_UNITS, type AmountUnitKey } from '../shopping.constants';

/** The sheet's three tabs, as the endpoint names them. */
const UNIT_TO_API: Record<AmountUnitKey, ShoppingUnit> = {
    portion: 'serving',
    piece: 'piece',
    gram: 'gram',
};

// Без групування розрядів: «1 000» не пережив би parse (parseFloat → 1).
const formatValue = (value: number) => value.toLocaleString('uk-UA', { useGrouping: false });

const parseValue = (text: string) => {
    const parsed = Number.parseFloat(text.replace(/[\s  ]/g, '').replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
};

export const useProductAmountScreen = () => {
    const { t } = useAppTranslation(['shopping', 'common']);
    const { productId } = useLocalSearchParams<{ productId?: string }>();

    const addItem = useAddShoppingItem();

    // The picker pushed here straight from the catalogue, so the product is
    // already in the cache — this read costs nothing in the normal path and
    // covers a deep link in the abnormal one.
    const { data } = useGetProducts();
    const product = useMemo(
        () => data?.pages.flatMap(page => page.data).find(item => item.id === productId),
        [data, productId],
    );

    // The sheet opens on «Порція» (665:11663).
    const [unit, setUnit] = useState<AmountUnitKey>('portion');
    const [valueText, setValueText] = useState(() => formatValue(AMOUNT_UNITS.portion.initial));

    // Невалідний/відсутній productId (діплінк, відновлений стан) — тихо
    // закриваємо шит замість показу першого-ліпшого продукту.
    useEffect(() => {
        if (!productId && router.canGoBack()) router.back();
    }, [productId]);

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

    /** What one piece of this product weighs; the catalogue default fills in. */
    const pieceGrams = product?.servingWeightG ?? AMOUNT_UNITS.piece.grams;

    const handleAdd = useCallback(() => {
        if (!productId || addItem.isPending) return;

        const config = AMOUNT_UNITS[unit];
        const value = Math.min(Math.max(parseValue(valueText), config.min), config.max);

        // Переводить у грами сервер — він знає, скільки важить порція саме
        // цього продукту, і має робити це однаково для всіх клієнтів.
        addItem.mutate(
            { productId, unit: UNIT_TO_API[unit], value },
            {
                onSuccess: () => {
                    ToastService.success(t('shopping:amount.added-toast'));
                    router.back();
                },
                onError: () => ToastService.error(t('common:states.error')),
            },
        );
    }, [addItem, productId, t, unit, valueText]);

    return {
        product,
        title: product?.name ?? '',
        unit,
        handleUnitChange,
        valueText,
        setValueText,
        suffix: t(`shopping:amount.suffix.${unit}`),
        /** «≈ 89г» next to the value in piece mode (665:11895). */
        hint:
            unit === 'piece'
                ? t('shopping:amount.piece-hint', { grams: Math.round(parseValue(valueText) * pieceGrams) })
                : undefined,
        isSubmitting: addItem.isPending,
        handleDecrease: () => step(-1),
        handleIncrease: () => step(1),
        handleAdd,
        handleClose: () => router.back(),
    };
};
