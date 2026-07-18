import React from 'react';
import { View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

export interface MacroChipsRowProps {
    protein: number;
    fats: number;
    carbs: number;
    /** Prepends the grey «ккал N» chip (list card / search rows). */
    kcal?: number;
}

/** Compact Б/Ж/В chip row used on recipe cards and search results. */
export const MacroChipsRow = ({ protein, fats, carbs, kcal }: MacroChipsRowProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['recipes', 'tracking']);

    const chips = [
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
            {kcal !== undefined ? (
                <View style={styles.kcalChip}>
                    <AppText variant="bodySmallReg" style={styles.kcalLabel}>
                        {t('recipes:list.kcal-label')}
                    </AppText>
                    <AppText variant="overline">{kcal}</AppText>
                </View>
            ) : null}
            {chips.map(chip => (
                <View key={chip.key} style={styles.chip}>
                    <View style={[styles.badge, { backgroundColor: chip.bg }]}>
                        <AppText variant="overline" style={{ color: chip.color }}>
                            {chip.label}
                        </AppText>
                    </View>
                    <AppText variant="overline">{chip.value}</AppText>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
    },
    kcalChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
        height: 20,
        paddingHorizontal: theme.spacing[1],
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.darkGrey,
    },
    kcalLabel: {
        color: theme.colors.semantic.white,
    },
    badge: {
        minWidth: 16,
        height: 16,
        paddingHorizontal: theme.spacing[1],
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
}));
