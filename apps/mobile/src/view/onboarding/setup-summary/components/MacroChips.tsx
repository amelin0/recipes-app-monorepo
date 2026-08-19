import React from 'react';
import { View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

export interface MacroChip {
    key: string;
    /** Single-letter macro badge: Б / Ж / В. */
    letter: string;
    value: string;
}

export interface MacroChipsProps {
    chips: MacroChip[];
}

/** Protein / fat / carb badges under the calorie goal (864:125563). */
export const MacroChips = ({ chips }: MacroChipsProps) => {
    const { theme } = useUnistyles();

    const tone: Record<string, { bg: string; fg: string }> = {
        protein: { bg: theme.colors.semantic.lightNegative, fg: theme.colors.semantic.negative },
        fat: { bg: theme.colors.semantic.lightPositive, fg: theme.colors.semantic.positive },
        carbs: { bg: theme.colors.semantic.lightOcean, fg: theme.colors.semantic.ocean },
    };

    return (
        <View style={styles.row}>
            {chips.map(chip => (
                <View key={chip.key} style={styles.chip}>
                    <View style={styles.badge(tone[chip.key]?.bg ?? theme.colors.semantic.lightGrey)}>
                        <AppText variant="bodySmallReg" style={{ color: tone[chip.key]?.fg }}>
                            {chip.letter}
                        </AppText>
                    </View>
                    <AppText variant="bodySmallReg">{chip.value}</AppText>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    row: {
        flexDirection: 'row',
        gap: theme.spacing[2],
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
    },
    badge: (color: string) => ({
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: color,
    }),
}));
