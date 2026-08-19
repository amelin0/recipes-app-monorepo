import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

export interface PortionLegendProps {
    mineLabel: string;
    othersLabel: string;
}

/** Colour key under the plate (811:58865). */
export const PortionLegend = ({ mineLabel, othersLabel }: PortionLegendProps) => (
    <View style={styles.row}>
        <View style={styles.item}>
            <View style={[styles.dot, styles.mine]} />
            <AppText variant="bodyMediumReg">{mineLabel}</AppText>
        </View>
        <View style={styles.item}>
            <View style={[styles.dot, styles.others]} />
            <AppText variant="bodyMediumReg">{othersLabel}</AppText>
        </View>
    </View>
);

const styles = StyleSheet.create(theme => ({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[2],
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: theme.radius.full,
    },
    mine: {
        backgroundColor: theme.colors.branding.accent,
    },
    others: {
        backgroundColor: theme.colors.semantic.darkGrey,
    },
}));
