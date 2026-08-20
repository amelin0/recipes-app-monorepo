import React from 'react';
import { View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

export interface IngredientMacrosProps {
    protein: number;
    fats: number;
    carbs: number;
}

/** Ряд круглих 20×20 бейджів Б/Ж/В із числами (984:58871). */
export const IngredientMacros = ({ protein, fats, carbs }: IngredientMacrosProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['tracking']);

    const macros = [
        {
            key: 'protein',
            label: t('tracking:home.macros.protein'),
            value: protein,
            color: theme.colors.semantic.negative,
            bg: theme.colors.semantic.lightNegative,
        },
        {
            key: 'fats',
            label: t('tracking:home.macros.fats'),
            value: fats,
            color: theme.colors.semantic.positive,
            bg: theme.colors.semantic.lightPositive,
        },
        {
            key: 'carbs',
            label: t('tracking:home.macros.carbs'),
            value: carbs,
            color: theme.colors.semantic.ocean,
            bg: theme.colors.semantic.lightOcean,
        },
    ];

    return (
        <View style={styles.row}>
            {macros.map(macro => (
                <View key={macro.key} style={styles.macro}>
                    <View style={[styles.badge, { backgroundColor: macro.bg }]}>
                        <AppText variant="bodySmallReg" style={{ color: macro.color }}>
                            {macro.label}
                        </AppText>
                    </View>
                    <AppText variant="bodySmallReg">{macro.value}</AppText>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    row: {
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
        width: 20,
        height: 20,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
}));
