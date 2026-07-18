import React from 'react';
import { View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

export interface PortionMacrosRowProps {
    kcal: number;
    protein: number;
    fats: number;
    carbs: number;
}

/** КБЖВ of the selected portion: «ккал 842 Б 42г Ж 124г В 12г». */
export const PortionMacrosRow = ({ kcal, protein, fats, carbs }: PortionMacrosRowProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['recipes', 'tracking']);

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
            <View style={styles.macro}>
                <View style={styles.kcalBadge}>
                    <AppText variant="bodySmallBold" style={styles.kcalLabel}>
                        {t('recipes:details.kcal-label')}
                    </AppText>
                </View>
                <AppText variant="bodySmallReg" color="tertiary">
                    {kcal.toLocaleString('en-US')}
                </AppText>
            </View>
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
    );
};

const styles = StyleSheet.create(theme => ({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: theme.spacing[3],
    },
    macro: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
    },
    kcalBadge: {
        paddingHorizontal: theme.spacing[1],
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: theme.colors.semantic.white,
    },
    kcalLabel: {
        color: theme.colors.semantic.darkGrey,
    },
    badge: {
        paddingHorizontal: theme.spacing[1],
        paddingVertical: 2,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
}));
