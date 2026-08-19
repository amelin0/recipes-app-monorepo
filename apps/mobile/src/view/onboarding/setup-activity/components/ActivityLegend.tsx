import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

export interface ActivityLegendProps {
    /** Labels for levels 1..8, in order. */
    labels: string[];
}

/** Legend under the stepper — one numbered badge per level (984:58077). */
export const ActivityLegend = ({ labels }: ActivityLegendProps) => {
    return (
        <View style={styles.list}>
            {labels.map((label, index) => (
                <View key={label} style={styles.row}>
                    <View style={styles.badge}>
                        <AppText variant="bodySmallBold">{String(index + 1)}</AppText>
                    </View>
                    <AppText variant="bodyMediumReg" style={styles.label}>
                        {label}
                    </AppText>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    list: {
        width: '100%',
        gap: theme.spacing[2],
    },
    row: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
    },
    badge: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.active.tertiary,
    },
    label: {
        flex: 1,
    },
}));
