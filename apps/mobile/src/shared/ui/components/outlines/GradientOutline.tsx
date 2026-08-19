import React, { useState } from 'react';
import { StyleSheet as RNStyleSheet, View, type LayoutChangeEvent } from 'react-native';

import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useUnistyles } from 'react-native-unistyles';

export interface GradientOutlineProps {
    /** Corner radius of the card being outlined. */
    radius: number;
    /** Stroke width. @default 1 */
    width?: number;
}

/**
 * End point of a gradient that runs corner to corner *as Figma draws it*.
 *
 * Figma resolves an objectBoundingBox gradient in the unit square and then
 * stretches it, so both off-diagonal corners land on the middle stop.
 * react-native-svg instead projects geometrically, which on a wide card pulls
 * the midpoint well left of the corner — these coordinates put it back.
 */
const diagonal = (width: number, height: number) => {
    const span = width * width + height * height;
    if (span === 0) return { x2: 0, y2: 0 };

    return {
        x2: (2 * width * height * height) / span,
        y2: (2 * width * width * height) / span,
    };
};

/**
 * The design's highlight outline: a hairline stroke that runs peach at the
 * top-left, fades through white on the anti-diagonal, and lands pink at the
 * bottom-right (911:52889, 911:52521, 435:6045).
 *
 * Rendered as an absolutely-positioned overlay rather than a `borderWidth`, for
 * two reasons: RN borders take a single flat colour, and they eat into the
 * padding box — Figma centres this stroke on the frame, so the content must
 * keep its full width.
 */
export const GradientOutline = ({ radius, width = 1 }: GradientOutlineProps) => {
    const { theme } = useUnistyles();
    const [size, setSize] = useState<{ width: number; height: number } | null>(null);

    const handleLayout = (event: LayoutChangeEvent) => {
        const { width: w, height: h } = event.nativeEvent.layout;
        if (size?.width !== w || size?.height !== h) setSize({ width: w, height: h });
    };

    return (
        <View pointerEvents="none" style={RNStyleSheet.absoluteFill} onLayout={handleLayout}>
            {size ? (
                <Svg width={size.width} height={size.height}>
                    <Defs>
                        {/* Stops sit where the Figma raster shows the peach
                            plateau end (17%) and the pink saturate (90%); SVG
                            clamps beyond them. */}
                        <LinearGradient
                            id="cardOutline"
                            gradientUnits="userSpaceOnUse"
                            x1={0}
                            y1={0}
                            {...diagonal(size.width, size.height)}
                        >
                            <Stop offset="0.17" stopColor={theme.colors.gradient.outlineFrom} />
                            <Stop offset="0.5" stopColor={theme.colors.semantic.white} />
                            <Stop offset="0.9" stopColor={theme.colors.gradient.outlineTo} />
                        </LinearGradient>
                    </Defs>
                    <Rect
                        x={width / 2}
                        y={width / 2}
                        width={Math.max(size.width - width, 0)}
                        height={Math.max(size.height - width, 0)}
                        rx={Math.max(radius - width / 2, 0)}
                        fill="none"
                        stroke="url(#cardOutline)"
                        strokeWidth={width}
                    />
                </Svg>
            ) : null}
        </View>
    );
};
