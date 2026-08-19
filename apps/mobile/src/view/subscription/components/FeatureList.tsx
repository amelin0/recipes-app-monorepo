import React from 'react';
import { View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText, TickCircle } from '@/shared/ui/components';

export interface FeatureListProps {
    /** One line per unlocked capability, already translated. */
    items: string[];
    /** Vertical gap between rows — 8 on the paywall, 12 after it. @default 8 */
    gap?: number;
}

/** Ticked capability list — «Що входить в план» (911:52861) and «Розблоковано» (911:52545). */
export const FeatureList = ({ items, gap }: FeatureListProps) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.root(gap ?? theme.spacing[2])}>
            {items.map(item => (
                <View key={item} style={styles.row}>
                    <TickCircle size={20} color={theme.colors.semantic.positive} />
                    <AppText style={styles.label}>{item}</AppText>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    root: (gap: number) => ({
        width: '100%',
        gap,
    }),
    row: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
    },
    label: {
        flex: 1,
    },
}));
