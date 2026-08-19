import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

export interface ChartBar {
    key: string;
    value: number;
    color: string;
}

export interface BarGroup {
    /** Day under the column («12/7»). */
    label: string;
    bars: ChartBar[];
}

export interface MetricBarChartProps {
    groups: BarGroup[];
    /** Axis labels, highest first. The first one is the top of the scale. */
    axis: string[];
    /** Value the tallest bar represents. */
    max: number;
}

const LABEL_WIDTH = 26;
const LABEL_GAP = 4;
const TRACK_HEIGHT = 110;
const ROW = 13;

/** Calories, water and steps per day (670:26765). */
export const MetricBarChart = ({ groups, axis, max }: MetricBarChartProps) => {
    const step = axis.length > 1 ? (TRACK_HEIGHT + ROW - ROW) / (axis.length - 1) : 0;

    return (
        <View style={styles.root}>
            <View style={styles.axis}>
                {axis.map((label, index) => (
                    <AppText key={label} variant="overline" style={[styles.axisLabel, { top: index * step }]}>
                        {label}
                    </AppText>
                ))}
            </View>

            <View style={styles.plot}>
                <View style={styles.track}>
                    {groups.map(group => (
                        <View key={group.label} style={styles.column}>
                            {group.bars.map(bar => (
                                <View
                                    key={bar.key}
                                    style={[
                                        styles.bar(group.bars.length),
                                        {
                                            height: Math.max(
                                                max > 0 ? (bar.value / max) * TRACK_HEIGHT : 0,
                                                bar.value > 0 ? 2 : 0,
                                            ),
                                            backgroundColor: bar.color,
                                        },
                                    ]}
                                />
                            ))}
                        </View>
                    ))}
                </View>

                <View style={styles.labels}>
                    {groups.map(group => (
                        <AppText key={group.label} variant="overline" style={styles.columnLabel}>
                            {group.label}
                        </AppText>
                    ))}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    root: {
        width: '100%',
        flexDirection: 'row',
        gap: LABEL_GAP,
    },
    axis: {
        width: LABEL_WIDTH,
        height: TRACK_HEIGHT + ROW,
    },
    axisLabel: {
        position: 'absolute',
        width: LABEL_WIDTH,
        textAlign: 'left',
        color: theme.colors.semantic.darkGrey,
    },
    plot: {
        flex: 1,
        minWidth: 0,
    },
    track: {
        height: TRACK_HEIGHT,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    column: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: theme.spacing[1],
        width: 32,
    },
    // One bar fills the column; a planned/actual pair splits it.
    bar: (count: number) => ({
        width: count > 1 ? 14 : 32,
        borderTopLeftRadius: theme.radius.sm,
        borderTopRightRadius: theme.radius.sm,
    }),
    labels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    columnLabel: {
        width: 32,
        textAlign: 'center',
        color: theme.colors.semantic.darkGrey,
    },
}));
