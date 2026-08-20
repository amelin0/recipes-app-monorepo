import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { IngredientMacros } from '../../components';
import type { MealIngredient } from '../../recipe.constants';

export interface IngredientRowProps {
    ingredient: MealIngredient;
}

/** Ingredient list row: emoji + name + Б/Ж/В mini-badges + weight. */
export const IngredientRow = ({ ingredient }: IngredientRowProps) => {
    const { t } = useAppTranslation(['recipes']);

    return (
        <View style={styles.row}>
            <AppText style={styles.emoji}>{ingredient.emoji}</AppText>
            <View style={styles.info}>
                <AppText variant="bodyMediumBold">{ingredient.name}</AppText>
                <IngredientMacros protein={ingredient.protein} fats={ingredient.fats} carbs={ingredient.carbs} />
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
}));
