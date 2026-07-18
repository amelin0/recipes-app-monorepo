import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import Svg, { Circle } from 'react-native-svg';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export interface GaugeChartProps {
    /** Progress 0..1 (clamped). */
    progress: number;
    /** Outer size in px. @default 180 */
    size?: number;
    /** Arc stroke width. @default 12 */
    strokeWidth?: number;
    /** Sweep of the arc in degrees (gap sits at the bottom). @default 260 */
    arcDegrees?: number;
    /** Fill color. Defaults to Semantic/positive. */
    color?: string;
    /** Center content (numbers, labels). */
    children?: React.ReactNode;
    /** Extra styles merged onto the wrapper. */
    style?: StyleProp<ViewStyle>;
}

/**
 * Speedometer-style gauge — RFDS `chart speed` (node 54650:622). A round arc
 * open at the bottom with the value rendered in the center slot.
 */
export const GaugeChart = ({
    progress,
    size = 180,
    strokeWidth = 12,
    arcDegrees = 260,
    color,
    children,
    style,
}: GaugeChartProps) => {
    const { theme } = useUnistyles();
    const clamped = Math.min(Math.max(progress, 0), 1);
    const fillColor = color ?? theme.colors.semantic.positive;

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const arcLength = (circumference * arcDegrees) / 360;
    // Rotate so the gap is centered at the bottom (90° = down).
    const startAngle = 90 + (360 - arcDegrees) / 2;

    return (
        <View style={[styles.wrapper(size), style]}>
            <Svg width={size} height={size}>
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={theme.colors.active.tertiary}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={`${arcLength} ${circumference}`}
                    transform={`rotate(${startAngle} ${size / 2} ${size / 2})`}
                />
                {clamped > 0 ? (
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={fillColor}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray={`${arcLength * clamped} ${circumference}`}
                        transform={`rotate(${startAngle} ${size / 2} ${size / 2})`}
                    />
                ) : null}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius - strokeWidth - 6}
                    stroke={fillColor}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray="0.1 6"
                    opacity={0.9}
                    transform={`rotate(${startAngle} ${size / 2} ${size / 2})`}
                />
            </Svg>
            <View style={styles.center}>{children}</View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: (size: number) => ({
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
    }),
    center: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
