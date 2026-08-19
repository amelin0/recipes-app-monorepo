import React from 'react';
import { Pressable, View, type PressableProps } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { CountDot } from '../badges';

export interface CircleIconButtonProps extends Omit<PressableProps, 'children' | 'style'> {
    /** Icon node (24px). */
    children: React.ReactNode;
    /** Screen-reader label. */
    accessibilityLabel: string;
    /** Optional badge count pinned to the top-right corner. */
    badgeCount?: number;
    /** Diameter in px. @default 44 */
    size?: number;
    /** `grey` — header/stepper circles; `glass` — nav bar actions. @default 'grey' */
    tone?: CircleIconButtonTone;
}

/** Fill of the circle: the RFDS grey chip, or the nav bar's translucent one. */
export type CircleIconButtonTone = 'grey' | 'glass';

/** Round icon button — RFDS secondary circle (header notifications, ± steppers). */
export const CircleIconButton = ({
    children,
    accessibilityLabel,
    badgeCount,
    size = 44,
    tone = 'grey',
    ...rest
}: CircleIconButtonProps) => {
    return (
        <View style={styles.wrapper(size)}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                hitSlop={8}
                style={({ pressed }) => styles.base(pressed, size, tone)}
                {...rest}
            >
                {children}
            </Pressable>
            {badgeCount ? <CountDot count={badgeCount} style={styles.badge} /> : null}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    wrapper: (size: number) => ({
        width: size,
        height: size,
    }),
    base: (pressed: boolean, size: number, tone: CircleIconButtonTone) => ({
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor:
            tone === 'glass'
                ? pressed
                    ? theme.colors.active.grey30
                    : theme.colors.semantic.white30
                : pressed
                  ? theme.colors.active.tertiary
                  : theme.colors.semantic.lightGrey,
    }),
    badge: {
        position: 'absolute',
        // The design insets the dot 8 into the 44 button rather than hanging it
        // off the corner (435:6613 — dot at 24,8 of a 44 box).
        top: theme.spacing[2],
        right: theme.spacing[2],
    },
}));
