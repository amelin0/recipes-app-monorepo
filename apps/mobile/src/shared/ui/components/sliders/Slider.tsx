import React, { useCallback, useMemo, useRef } from 'react';
import { PanResponder, View, type StyleProp, type ViewStyle } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

export interface SliderProps {
    /** Current value (clamped to [min, max]). */
    value: number;
    min: number;
    max: number;
    /** Snap step. @default 1 */
    step?: number;
    /** Fill color. */
    color: string;
    /** Track height in px. @default 8 */
    height?: number;
    onChange: (value: number) => void;
    /** Screen-reader label. */
    accessibilityLabel?: string;
    /** Extra styles merged onto the touch area. */
    style?: StyleProp<ViewStyle>;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * Thumbless track slider (RFDS nutrient rows): drag or tap anywhere on the
 * track to set the value. The fill doubles as the indicator.
 */
export const Slider = ({
    value,
    min,
    max,
    step = 1,
    color,
    height = 8,
    onChange,
    accessibilityLabel,
    style,
}: SliderProps) => {
    const widthRef = useRef(0);

    const updateFromX = useCallback(
        (x: number) => {
            if (!widthRef.current) return;
            const ratio = clamp(x / widthRef.current, 0, 1);
            const stepped = Math.round((min + ratio * (max - min)) / step) * step;
            onChange(clamp(stepped, min, max));
        },
        [min, max, step, onChange],
    );

    const panResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: () => true,
                onPanResponderGrant: event => updateFromX(event.nativeEvent.locationX),
                onPanResponderMove: event => updateFromX(event.nativeEvent.locationX),
            }),
        [updateFromX],
    );

    const progress = max > min ? clamp((value - min) / (max - min), 0, 1) : 0;

    return (
        <View
            accessibilityRole="adjustable"
            accessibilityLabel={accessibilityLabel}
            accessibilityValue={{ min, max, now: value }}
            onLayout={event => {
                widthRef.current = event.nativeEvent.layout.width;
            }}
            style={[styles.touchArea, style]}
            {...panResponder.panHandlers}
        >
            <View style={styles.track(height)}>
                <View style={[styles.fill(height, progress), { backgroundColor: color }]} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    touchArea: {
        width: '100%',
        paddingVertical: theme.spacing[1],
        justifyContent: 'center',
    },
    track: (height: number) => ({
        width: '100%',
        height,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.active.tertiary,
        overflow: 'hidden',
    }),
    fill: (height: number, progress: number) => ({
        width: `${progress * 100}%`,
        height,
        borderRadius: theme.radius.full,
    }),
}));
