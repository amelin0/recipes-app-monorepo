import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

export interface LegendItem {
    key: string;
    label: string;
    color: string;
}

export interface ChartLegendProps {
    items: LegendItem[];
}

/** Colour key under the calorie chart (805:16732). */
export const ChartLegend = ({ items }: ChartLegendProps) => (
    <View style={styles.row}>
        {items.map(item => (
            <View key={item.key} style={styles.item}>
                <View style={[styles.dot, { backgroundColor: item.color }]} />
                <AppText variant="overline" style={styles.label}>
                    {item.label}
                </AppText>
            </View>
        ))}
    </View>
);

const styles = StyleSheet.create(theme => ({
    row: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: theme.radius.full,
    },
    label: {
        color: theme.colors.semantic.darkGrey,
    },
}));
