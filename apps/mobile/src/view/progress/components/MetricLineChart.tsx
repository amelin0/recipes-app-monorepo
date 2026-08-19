import React, { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';

import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

export interface LinePoint {
    /** Date under the point («12/6»). */
    label: string;
    value: number;
}

export interface MetricLineChartProps {
    points: LinePoint[];
    /** Axis labels, highest first — they set the value range too. */
    axis: number[];
}

/** Width reserved for the y-axis labels, and the gap before the plot. */
const LABEL_WIDTH = 24;
const LABEL_GAP = 4;
/** Each axis row is a 13pt line box; the rule runs through its middle. */
const ROW = 13;
const ROW_GAP = 8;
const PLOT_HEIGHT = 100;
/** Width of a point's column — the first and last sit half a column in. */
const COLUMN = 38;
const DOT = 10;

/** Weight, waist and height over time (670:26730). */
export const MetricLineChart = ({ points, axis }: MetricLineChartProps) => {
    const { theme } = useUnistyles();
    const [plotWidth, setPlotWidth] = useState(0);

    const handleLayout = (event: LayoutChangeEvent) => setPlotWidth(event.nativeEvent.layout.width);

    const top = ROW / 2;
    const bottom = (axis.length - 1) * (ROW + ROW_GAP) + ROW / 2;
    const max = axis[0] ?? 0;
    const min = axis[axis.length - 1] ?? 0;

    const yFor = (value: number) => {
        if (max === min) return (top + bottom) / 2;
        return bottom - ((value - min) / (max - min)) * (bottom - top);
    };
    const xFor = (index: number) => {
        if (points.length <= 1) return plotWidth / 2;
        return COLUMN / 2 + (index * (plotWidth - COLUMN)) / (points.length - 1);
    };

    return (
        <View style={styles.root}>
            <View style={styles.grid}>
                {axis.map(value => (
                    <View key={value} style={styles.gridRow}>
                        <AppText variant="overline" style={styles.axisLabel}>
                            {value}
                        </AppText>
                        <View style={styles.rule} />
                    </View>
                ))}
            </View>

            <View style={styles.plot} onLayout={handleLayout} pointerEvents="none">
                {plotWidth > 0 ? (
                    <Svg width={plotWidth} height={PLOT_HEIGHT}>
                        <Polyline
                            points={points.map((point, index) => `${xFor(index)},${yFor(point.value)}`).join(' ')}
                            fill="none"
                            stroke={theme.colors.semantic.positive}
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        {points.map((point, index) => (
                            <Circle
                                key={point.label}
                                cx={xFor(index)}
                                cy={yFor(point.value)}
                                r={DOT / 2}
                                fill={theme.colors.semantic.positive}
                            />
                        ))}
                        {/* Keeps the SVG box honest when a single point would
                            otherwise collapse the polyline to nothing. */}
                        <Line x1={0} y1={PLOT_HEIGHT} x2={0} y2={PLOT_HEIGHT} stroke="none" />
                    </Svg>
                ) : null}
            </View>

            <View style={styles.labels}>
                {points.map(point => (
                    <AppText key={point.label} variant="overline" style={styles.pointLabel}>
                        {point.label}
                    </AppText>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    root: {
        width: '100%',
        paddingBottom: theme.spacing[6],
    },
    grid: {
        width: '100%',
        gap: ROW_GAP,
    },
    gridRow: {
        width: '100%',
        height: ROW,
        flexDirection: 'row',
        alignItems: 'center',
        gap: LABEL_GAP,
    },
    axisLabel: {
        minWidth: LABEL_WIDTH,
        textAlign: 'right',
        color: theme.colors.semantic.darkGrey,
    },
    rule: {
        flex: 1,
        height: 1,
        backgroundColor: theme.colors.forms.lightBorder,
    },
    plot: {
        position: 'absolute',
        top: 0,
        left: LABEL_WIDTH + LABEL_GAP,
        right: 0,
        height: PLOT_HEIGHT,
    },
    labels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginLeft: LABEL_WIDTH + LABEL_GAP,
        marginTop: 4,
    },
    pointLabel: {
        width: COLUMN,
        textAlign: 'center',
        color: theme.colors.semantic.darkGrey,
    },
}));
