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
    /**
     * Give the calorie chip the same width as the macro ones. The dish detail
     * lets it hug its content (984:57591); the logged-meal card spreads all
     * four evenly (811:55249).
     */
    equalWidths?: boolean;
}

const ORDER: MacroKey[] = ['protein', 'fats', 'carbs'];

/**
 * Energy + macros strip under a dish title (984:57590, 811:55247). The calorie
 * chip hugs its content; the three macro chips share the rest evenly.
 */
export const NutritionSummaryRow = ({ calories, macros, equalWidths = false }: NutritionSummaryRowProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['tracking']);
    const palette = macroPalette(theme.colors);

    return (
        <View style={styles.row}>
            <View style={styles.caloriesChip(equalWidths)}>
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
    caloriesChip: (equalWidths: boolean) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[1],
        // The wide padding only holds while the chip hugs its content. Figma
        // keeps it declared on the stretched variant too but the quarter-width
        // box is narrower than content + padding, so it centres and the padding
        // gives way — matching it here means dropping to the macro chips' 4.
        paddingHorizontal: equalWidths ? theme.spacing[1] : theme.spacing[3],
        paddingVertical: theme.spacing[2],
        borderRadius: 14,
        backgroundColor: theme.colors.semantic.lightGrey,
        ...(equalWidths ? { flex: 1, minWidth: 0 } : null),
    }),
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
        minWidth: 0,
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
