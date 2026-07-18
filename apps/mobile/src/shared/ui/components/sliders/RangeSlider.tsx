import React, { useCallback, useMemo, useRef } from 'react';
import { PanResponder, View, type StyleProp, type ViewStyle } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

export interface RangeSliderProps {
    low: number;
    high: number;
    min: number;
    max: number;
    /** Snap step. @default 1 */
    step?: number;
    onChange: (low: number, high: number) => void;
    /** Screen-reader label. */
    accessibilityLabel?: string;
    /** Extra styles merged onto the touch area. */
    style?: StyleProp<ViewStyle>;
}

const THUMB_SIZE = 28;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * Two-thumb range slider (RFDS filter «Енергетична цінність»): accent track
 * between white 28px thumbs. Dragging moves the nearest thumb.
 */
export const RangeSlider = ({
    low,
    high,
    min,
    max,
    step = 1,
    onChange,
    accessibilityLabel,
    style,
}: RangeSliderProps) => {
    const widthRef = useRef(0);
    const valuesRef = useRef({ low, high });
    valuesRef.current = { low, high };

    const updateFromX = useCallback(
        (x: number) => {
            if (!widthRef.current) return;
            const ratio = clamp(x / widthRef.current, 0, 1);
            const raw = min + ratio * (max - min);
            const stepped = clamp(Math.round(raw / step) * step, min, max);
            const { low: currentLow, high: currentHigh } = valuesRef.current;

            // Move whichever thumb is closer to the touch.
            if (Math.abs(stepped - currentLow) <= Math.abs(stepped - currentHigh)) {
                onChange(Math.min(stepped, currentHigh), currentHigh);
            } else {
                onChange(currentLow, Math.max(stepped, currentLow));
            }
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

    const span = max - min || 1;
    const lowRatio = clamp((low - min) / span, 0, 1);
    const highRatio = clamp((high - min) / span, 0, 1);

    return (
        <View
            accessibilityRole="adjustable"
            accessibilityLabel={accessibilityLabel}
            accessibilityValue={{ min, max, text: `${low}–${high}` }}
            onLayout={event => {
                widthRef.current = event.nativeEvent.layout.width;
            }}
            style={[styles.touchArea, style]}
            {...panResponder.panHandlers}
        >
            <View style={styles.track}>
                <View style={styles.fill(lowRatio, highRatio)} />
            </View>
            <View style={styles.thumb(lowRatio)} pointerEvents="none" />
            <View style={styles.thumb(highRatio)} pointerEvents="none" />
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    touchArea: {
        width: '100%',
        height: THUMB_SIZE + 8,
        justifyContent: 'center',
    },
    track: {
        width: '100%',
        height: 8,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.active.tertiary,
        overflow: 'hidden',
    },
    fill: (lowRatio: number, highRatio: number) => ({
        position: 'absolute',
        left: `${lowRatio * 100}%`,
        width: `${Math.max(highRatio - lowRatio, 0) * 100}%`,
        height: 8,
        backgroundColor: theme.colors.branding.accent,
    }),
    thumb: (ratio: number) => ({
        position: 'absolute',
        left: `${ratio * 100}%`,
        marginLeft: -THUMB_SIZE / 2,
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.white,
        ...theme.shadow.block,
    }),
}));
