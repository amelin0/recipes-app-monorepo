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
}

/** Round icon button — RFDS secondary circle (header notifications, ± steppers). */
export const CircleIconButton = ({
    children,
    accessibilityLabel,
    badgeCount,
    size = 44,
    ...rest
}: CircleIconButtonProps) => {
    return (
        <View style={styles.wrapper(size)}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                hitSlop={8}
                style={({ pressed }) => styles.base(pressed, size)}
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
    base: (pressed: boolean, size: number) => ({
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: pressed ? theme.colors.active.tertiary : theme.colors.semantic.lightGrey,
    }),
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
    },
}));
