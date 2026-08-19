import React, { useMemo, useRef } from 'react';
import { Image, PanResponder, View, type ImageSourcePropType } from 'react-native';

import Svg, { Path } from 'react-native-svg';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

export interface PortionDialProps {
    /** Share of the whole dish the user ate, 0..1. */
    share: number;
    onShareChange: (share: number) => void;
    /** Photo of the dish, shown inside the plate. */
    image: ImageSourcePropType;
    /** Screen-reader label for the draggable wedge. */
    accessibilityLabel: string;
}

const DIAL = 200;
/** White plate behind the food. */
const PLATE = 186;
/** The photo, and the circle the handle rides. */
const FOOD = 146;
const HANDLE = 24;
const BADGE = 44;

const FOOD_RADIUS = FOOD / 2;
const CENTER = DIAL / 2;

/** Pie sector from 12 o'clock, sweeping clockwise, in the food circle's box. */
const wedgePath = (share: number) => {
    const r = FOOD_RADIUS;
    if (share >= 1) {
        return `M ${r},0 A ${r},${r} 0 1 1 ${r - 0.01},0 Z`;
    }

    const angle = share * 2 * Math.PI;
    const x = r + r * Math.sin(angle);
    const y = r - r * Math.cos(angle);

    return `M ${r},${r} L ${r},0 A ${r},${r} 0 ${share > 0.5 ? 1 : 0} 1 ${x},${y} Z`;
};

/**
 * Plate the user drags to say how much of the dish they ate (811:58857).
 *
 * The design fills the eaten wedge with an illustrated green graphic; this
 * paints the accent over the photo instead, which reads a shade darker.
 */
export const PortionDial = ({ share, onShareChange, image, accessibilityLabel }: PortionDialProps) => {
    const { theme } = useUnistyles();

    // The handler is created once — reading `share` inside it would capture the
    // first render's value, and every update goes through the angle anyway.
    const onShareRef = useRef(onShareChange);
    onShareRef.current = onShareChange;

    const responder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: () => true,
                onPanResponderGrant: event => updateFromTouch(event.nativeEvent.locationX, event.nativeEvent.locationY),
                onPanResponderMove: event => updateFromTouch(event.nativeEvent.locationX, event.nativeEvent.locationY),
            }),
        [],
    );

    function updateFromTouch(x: number, y: number) {
        const dx = x - CENTER;
        const dy = CENTER - y;
        // Clockwise from 12 o'clock, normalised to a full turn.
        const angle = Math.atan2(dx, dy);
        onShareRef.current(((angle < 0 ? angle + 2 * Math.PI : angle) / (2 * Math.PI)) % 1);
    }

    const handleAngle = share * 2 * Math.PI;
    const handleLeft = CENTER + FOOD_RADIUS * Math.sin(handleAngle) - HANDLE / 2;
    const handleTop = CENTER - FOOD_RADIUS * Math.cos(handleAngle) - HANDLE / 2;

    return (
        <View
            accessibilityRole="adjustable"
            accessibilityLabel={accessibilityLabel}
            accessibilityValue={{ min: 0, max: 100, now: Math.round(share * 100) }}
            style={styles.dial}
            {...responder.panHandlers}
        >
            <View style={styles.plate} />

            <View style={styles.food}>
                <Image source={image} style={styles.photo} resizeMode="cover" accessibilityIgnoresInvertColors />
                <Svg width={FOOD} height={FOOD} style={styles.wedge}>
                    <Path d={wedgePath(share)} fill={theme.colors.branding.accent} fillOpacity={0.8} />
                </Svg>
            </View>

            <View style={styles.badge}>
                <AppText variant="bodySmallBold">{Math.round(share * 100)}%</AppText>
            </View>

            <View style={[styles.handle, { left: handleLeft, top: handleTop }]}>
                <View style={styles.handleDot} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    dial: {
        width: DIAL,
        height: DIAL,
        alignItems: 'center',
        justifyContent: 'center',
    },
    plate: {
        position: 'absolute',
        width: PLATE,
        height: PLATE,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.white,
        ...theme.shadow.elements,
    },
    food: {
        width: FOOD,
        height: FOOD,
        borderRadius: theme.radius.full,
        overflow: 'hidden',
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    wedge: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    badge: {
        position: 'absolute',
        width: BADGE,
        height: BADGE,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        borderWidth: 4,
        borderColor: theme.colors.semantic.white,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    handle: {
        position: 'absolute',
        width: HANDLE,
        height: HANDLE,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        borderWidth: 2,
        borderColor: theme.colors.branding.accent,
        backgroundColor: theme.colors.semantic.white,
    },
    handleDot: {
        width: 6,
        height: 6,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.branding.accent,
    },
}));
