import React from 'react';
import { View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import type { MealIngredient } from '../../recipe.constants';

export interface IngredientRowProps {
    ingredient: MealIngredient;
}

/** Ingredient list row: emoji + name + Б/Ж/В mini-badges + weight. */
export const IngredientRow = ({ ingredient }: IngredientRowProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['recipes', 'tracking']);

    const macros = [
        {
            key: 'protein',
            label: t('tracking:home.macros.protein'),
            value: ingredient.protein,
            color: theme.colors.semantic.negative,
            bg: theme.colors.semantic.lightNegative,
        },
        {
            key: 'fats',
            label: t('tracking:home.macros.fats'),
            value: ingredient.fats,
            color: theme.colors.semantic.positive,
            bg: theme.colors.semantic.lightPositive,
        },
        {
            key: 'carbs',
            label: t('tracking:home.macros.carbs'),
            value: ingredient.carbs,
            color: theme.colors.semantic.ocean,
            bg: theme.colors.semantic.lightOcean,
        },
    ];

    return (
        <View style={styles.row}>
            <AppText style={styles.emoji}>{ingredient.emoji}</AppText>
            <View style={styles.info}>
                <AppText variant="bodyMediumBold">{ingredient.name}</AppText>
                <View style={styles.macros}>
                    {macros.map(macro => (
                        <View key={macro.key} style={styles.macro}>
                            <View style={[styles.badge, { backgroundColor: macro.bg }]}>
                                <AppText variant="bodySmallBold" style={{ color: macro.color }}>
                                    {macro.label}
                                </AppText>
                            </View>
                            <AppText variant="bodySmallReg" color="tertiary">
                                {t('recipes:portions.grams-value', { value: macro.value })}
                            </AppText>
                        </View>
                    ))}
                </View>
            </View>
            <AppText variant="bodySmallBold">{t('recipes:portions.grams-value', { value: ingredient.grams })}</AppText>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
        padding: theme.spacing[3],
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.semantic.lightGrey,
        width: '100%',
    },
    emoji: {
        fontSize: 24,
        lineHeight: 30,
    },
    info: {
        flex: 1,
        gap: theme.spacing[1],
    },
    macros: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
    },
    macro: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
    },
    badge: {
        paddingHorizontal: theme.spacing[1],
        paddingVertical: 2,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
}));
