import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import CloseCircleIcon from '../../../../../assets/icons/close-circle.svg';
import { IngredientMacros } from '../../components';
import type { CreateDishIngredient } from '../../recipe.constants';

export interface IngredientEditRowProps {
    ingredient: CreateDishIngredient;
    onGramsChange: (grams: string) => void;
    onRemove: () => void;
}

/** Рядок інгредієнта форми: вага редагується, ⊗ прибирає (594:31930). */
export const IngredientEditRow = ({ ingredient, onGramsChange, onRemove }: IngredientEditRowProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['recipes']);
    const [focused, setFocused] = useState(false);

    return (
        <View style={styles.row}>
            <AppText style={styles.emoji}>{ingredient.emoji}</AppText>
            <View style={styles.info}>
                <AppText variant="bodyMediumBold">{ingredient.name}</AppText>
                <IngredientMacros protein={ingredient.protein} fats={ingredient.fats} carbs={ingredient.carbs} />
            </View>
            <View style={styles.weight}>
                <TextInput
                    value={String(ingredient.grams)}
                    onChangeText={onGramsChange}
                    selectTextOnFocus
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    keyboardType="number-pad"
                    accessibilityLabel={t('recipes:create-dish.weight-a11y', { name: ingredient.name })}
                    style={styles.weightInput(focused)}
                />
                <AppText variant="bodyMediumReg" style={styles.unit}>
                    {t('recipes:create-dish.grams-unit')}
                </AppText>
            </View>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('recipes:create-dish.remove-a11y', { name: ingredient.name })}
                hitSlop={8}
                onPress={onRemove}
                style={styles.remove}
            >
                <CloseCircleIcon width={20} height={20} color={theme.colors.semantic.negative} />
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 68,
        paddingLeft: theme.spacing[3],
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
        marginLeft: theme.spacing[3],
    },
    weight: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: theme.spacing[1],
    },
    // Число з тонким підкресленням; фокус підсвічує його акцентом (594:32288).
    weightInput: (focused: boolean) => ({
        ...theme.typography.bodyLargeBold,
        minWidth: 64,
        paddingVertical: 0,
        textAlign: 'right',
        color: theme.colors.elements.primary,
        borderBottomWidth: 1,
        borderBottomColor: focused ? theme.colors.branding.accent : theme.colors.active.tertiary,
    }),
    unit: {
        color: theme.colors.active.secondary,
    },
    remove: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing[3],
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: theme.colors.forms.lightBorder,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
}));
