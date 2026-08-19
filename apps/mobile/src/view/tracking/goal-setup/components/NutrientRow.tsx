import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppCard, AppText } from '@/shared/ui/components';

import ArrowRightIcon from '../../../../../assets/icons/arrow-right.svg';

export interface NutrientRowProps {
    emoji: string;
    title: string;
    /** Amount, already formatted. */
    value: string;
    /** Unit suffix (г / мл). */
    unit: string;
    onPress: () => void;
}

/** One nutrient of the daily goal (811:53525). */
export const NutrientRow = ({ emoji, title, value, unit, onPress }: NutrientRowProps) => {
    const { theme } = useUnistyles();

    return (
        <AppCard style={styles.card}>
            <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
                <AppText style={styles.emoji}>{emoji}</AppText>
                <AppText variant="bodyLargeBold" style={styles.title}>
                    {title}
                </AppText>
                <View style={styles.amount}>
                    <AppText variant="bodyLargeBold" style={styles.value}>
                        {value}
                    </AppText>
                    <AppText variant="bodyMediumReg" style={styles.unit}>
                        {unit}
                    </AppText>
                </View>
                <ArrowRightIcon width={16} height={16} color={theme.colors.elements.primary} />
            </Pressable>
        </AppCard>
    );
};

const styles = StyleSheet.create(theme => ({
    card: {
        alignItems: 'flex-start',
    },
    row: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
    },
    emoji: {
        fontSize: 20,
        lineHeight: 24,
        // Figma gives the emoji a 20pt box; the iOS glyph advance is wider and
        // would push the name right (811:53527).
        width: 20,
        textAlign: 'center',
    },
    title: {
        flex: 1,
        minWidth: 0,
    },
    amount: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
        // The value is a Number Input field, 2pt taller than its text (811:53530).
        paddingVertical: 2,
    },
    // Fixed column so the units line up down the list (811:53530).
    value: {
        width: 64,
        textAlign: 'right',
    },
    unit: {
        color: theme.colors.active.secondary,
    },
}));
