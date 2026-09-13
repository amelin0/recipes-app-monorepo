import React, { useEffect, useState } from 'react';
import { StyleSheet as RNStyleSheet, View, type LayoutChangeEvent } from 'react-native';

import Animated, {
    cancelAnimation,
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useUnistyles } from 'react-native-unistyles';

export interface GradientOutlineProps {
    /** Corner radius of the card being outlined. */
    radius: number;
    /** Stroke width. @default 1 */
    width?: number;
    /**
     * Spin the gradient so the highlight travels around the frame.
     *
     * For the one card that says «this is where you are now» — a still outline
     * is easy to read as decoration, a moving one is not.
     */
    animated?: boolean;
}

/** One turn of the highlight. */
const SPIN_MS = 4000;

/**
 * Side of the square that carries the spinning gradient, from the card it has
 * to cover.
 *
 * The square is centred and rotated, so what must cover the card at every
 * angle is its inscribed circle — hence the diagonal. Bigger than that and the
 * card samples only a thin slice of the gradient, which reads as one flat
 * colour instead of a travelling highlight.
 */
const spinSize = (width: number, height: number) => Math.ceil(Math.hypot(width, height));

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
export const GradientOutline = ({ radius, width = 1, animated = false }: GradientOutlineProps) => {
    const { theme } = useUnistyles();
    const [size, setSize] = useState<{ width: number; height: number } | null>(null);

    const angle = useSharedValue(0);

    useEffect(() => {
        if (!animated) return;

        // Крутиться сама градієнтна площина, а не обведення: підсвітка обходить
        // рамку по колу, а не блимає на місці.
        angle.value = 0;
        angle.value = withRepeat(withTiming(360, { duration: SPIN_MS, easing: Easing.linear }), -1, false);

        return () => cancelAnimation(angle);
    }, [animated, angle]);

    const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.value}deg` }] }));

    const handleLayout = (event: LayoutChangeEvent) => {
        const { width: w, height: h } = event.nativeEvent.layout;
        if (size?.width !== w || size?.height !== h) setSize({ width: w, height: h });
    };

    if (animated) {
        const side = size ? spinSize(size.width, size.height) : 0;

        return (
            // Обрізання круглим кутом і є рамкою: квадрат градієнта видно лише
            // там, де його не накриває суцільна серединка.
            <View
                pointerEvents="none"
                onLayout={handleLayout}
                style={[RNStyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}
            >
                <View style={[RNStyleSheet.absoluteFill, styles.center]}>
                    {side > 0 ? (
                        <Animated.View style={[{ width: side, height: side }, spin]}>
                            <Svg width={side} height={side}>
                                <Defs>
                                    {/* Перший і останній стопи однакові — інакше
                                        на стику оберту видно шов. */}
                                    <LinearGradient id="cardOutlineSpin" x1="0.5" y1="0" x2="0.5" y2="1">
                                        <Stop offset="0" stopColor={theme.colors.gradient.outlineFrom} />
                                        <Stop offset="0.25" stopColor={theme.colors.semantic.white} />
                                        <Stop offset="0.5" stopColor={theme.colors.gradient.outlineTo} />
                                        <Stop offset="0.75" stopColor={theme.colors.semantic.white} />
                                        <Stop offset="1" stopColor={theme.colors.gradient.outlineFrom} />
                                    </LinearGradient>
                                </Defs>
                                <Rect width={side} height={side} fill="url(#cardOutlineSpin)" />
                            </Svg>
                        </Animated.View>
                    ) : null}
                </View>

                {/* Накриває все, крім рамки завширшки `width`. Колір — той самий,
                    що й у картки, тож серединка лишається її власним тлом. */}
                <View
                    style={{
                        position: 'absolute',
                        top: width,
                        left: width,
                        right: width,
                        bottom: width,
                        borderRadius: Math.max(radius - width, 0),
                        backgroundColor: theme.colors.background.screen,
                    }}
                />
            </View>
        );
    }

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

const styles = RNStyleSheet.create({
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
