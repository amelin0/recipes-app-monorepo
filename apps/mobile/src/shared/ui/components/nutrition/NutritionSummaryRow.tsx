import React from 'react';
import { View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { useAppTranslation } from '@/shared/utils/translations';

import { AppText } from '../texts';

import { MacroBadge } from './MacroBadge';
import { macroPalette, type MacroKey } from './macro-palette';

export interface NutritionSummaryRowProps {
    /** Energy, already formatted («1,859»). */
    calories: string;
    /** Grams per macro, in Б/Ж/В order. */
    macros: Record<MacroKey, number>;
}

const ORDER: MacroKey[] = ['protein', 'fats', 'carbs'];

/**
 * Energy + macros strip under a dish title (984:57590, 811:55247). The calorie
 * chip hugs its content; the three macro chips share the rest evenly.
 */
export const NutritionSummaryRow = ({ calories, macros }: NutritionSummaryRowProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['tracking']);
    const palette = macroPalette(theme.colors);

    return (
        <View style={styles.row}>
            <View style={styles.caloriesChip}>
                <View style={styles.caloriesBadge}>
                    <AppText variant="bodySmallReg">{t('tracking:home.kcal-label')}</AppText>
                </View>
                <AppText variant="bodySmallReg">{calories}</AppText>
            </View>

            {ORDER.map(key => (
                <View key={key} style={styles.macroChip}>
                    <MacroBadge
                        letter={t(`tracking:home.macros.${key}`)}
                        color={palette[key].color}
                        backgroundColor={palette[key].backgroundColor}
                    />
                    <AppText variant="bodySmallReg">
                        {macros[key]}
                        <AppText style={styles.unit}>{t('tracking:home.grams')}</AppText>
                    </AppText>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    row: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
    },
    caloriesChip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[1],
        paddingHorizontal: theme.spacing[3],
        paddingVertical: theme.spacing[2],
        borderRadius: 14,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    caloriesBadge: {
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing[1],
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.active.tertiary,
    },
    macroChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[1],
        paddingHorizontal: theme.spacing[1],
        paddingVertical: theme.spacing[2],
        borderRadius: 14,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    unit: {
        fontSize: 9,
        lineHeight: 12,
    },
}));
