import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

export interface MetricStatBox {
    key: string;
    label: string;
    value: string;
    unit: string;
}

export interface MetricStatBoxesProps {
    /**
     * One array per row. The calorie screen puts the two norm boxes on their
     * own line above the three day counts (673:32960), so rows are explicit
     * rather than wrapped — a wrapped flex child stretches to fill its line.
     */
    rows: MetricStatBox[][];
}

/** Min / average / max and their kin (673:32394, 673:32960). */
export const MetricStatBoxes = ({ rows }: MetricStatBoxesProps) => (
    <View style={styles.root}>
        {rows.map((boxes, index) => (
            <View key={index} style={styles.row}>
                {boxes.map(box => (
                    <View key={box.key} style={styles.box}>
                        <AppText variant="bodySmallReg" style={styles.centered}>
                            {box.label}
                        </AppText>
                        <AppText variant="titleSmall" style={styles.centered}>
                            {box.value}
                        </AppText>
                        <AppText variant="bodySmallReg" style={[styles.centered, styles.muted]}>
                            {box.unit}
                        </AppText>
                    </View>
                ))}
            </View>
        ))}
    </View>
);

const styles = StyleSheet.create(theme => ({
    root: {
        width: '100%',
        gap: theme.spacing[2],
    },
    row: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: theme.spacing[2],
    },
    box: {
        flex: 1,
        minWidth: 0,
        alignItems: 'center',
        gap: theme.spacing[1],
        padding: theme.spacing[2],
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.semantic.lightOcean,
    },
    centered: {
        textAlign: 'center',
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
}));
