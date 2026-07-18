import React from 'react';
import { View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

export interface MealSummaryRowProps {
    kcal: number;
    protein: number;
    fats: number;
    carbs: number;
}

/** Summary strip under the meal title: grey «ккал N» chip + Б/Ж/В values. */
export const MealSummaryRow = ({ kcal, protein, fats, carbs }: MealSummaryRowProps) => {
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
            <View style={styles.kcalChip}>
                <AppText variant="bodySmallReg" color="tertiary">
                    {t('recipes:details.kcal-label')}
                </AppText>
                <AppText variant="bodyMediumBold">{kcal.toLocaleString('en-US')}</AppText>
            </View>
            {macros.map(macro => (
                <View key={macro.key} style={styles.macro}>
                    <View style={[styles.badge, { backgroundColor: macro.bg }]}>
                        <AppText variant="bodySmallBold" style={{ color: macro.color }}>
                            {macro.label}
                        </AppText>
                    </View>
                    <AppText variant="bodyMediumBold">
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
        gap: theme.spacing[2],
        width: '100%',
    },
    kcalChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
        paddingHorizontal: theme.spacing[3],
        paddingVertical: theme.spacing[2],
        borderRadius: 14,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    macro: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
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
