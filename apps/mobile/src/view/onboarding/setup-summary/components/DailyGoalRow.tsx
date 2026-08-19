import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

export interface DailyGoalRowProps {
    emoji: string;
    /** Tint behind the emoji — one per goal (864:125464, 125476, 125486). */
    badgeColor: string;
    label: string;
    value: string;
    /** Macro chips, on the calories row only. */
    children?: React.ReactNode;
}

/** One row inside the «Щоденні цілі» card (RFDS 864:125413). */
export const DailyGoalRow = ({ emoji, badgeColor, label, value, children }: DailyGoalRowProps) => {
    return (
        <View style={styles.row}>
            <View style={styles.badge(badgeColor)}>
                <AppText style={styles.emoji}>{emoji}</AppText>
            </View>

            <View style={styles.labels}>
                <AppText variant="bodySmallReg" style={styles.caption}>
                    {label}
                </AppText>
                <AppText variant="bodyLargeBold">{value}</AppText>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    row: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
        padding: theme.spacing[3],
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.forms.lightBorder,
        backgroundColor: theme.colors.semantic.white,
    },
    badge: (color: string) => ({
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.md,
        backgroundColor: color,
    }),
    emoji: {
        fontSize: 20,
        lineHeight: 26,
    },
    labels: {
        flex: 1,
        gap: theme.spacing[1],
    },
    caption: {
        color: theme.colors.semantic.darkGrey,
    },
}));
