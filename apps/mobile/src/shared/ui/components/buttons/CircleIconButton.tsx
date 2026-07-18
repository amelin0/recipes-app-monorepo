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
}

/** Round 44px icon button — RFDS secondary circle (header notifications etc.). */
export const CircleIconButton = ({ children, accessibilityLabel, badgeCount, ...rest }: CircleIconButtonProps) => {
    return (
        <View style={styles.wrapper}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                hitSlop={8}
                style={({ pressed }) => styles.base(pressed)}
                {...rest}
            >
                {children}
            </Pressable>
            {badgeCount ? <CountDot count={badgeCount} style={styles.badge} /> : null}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    wrapper: {
        width: 44,
        height: 44,
    },
    base: (pressed: boolean) => ({
        width: 44,
        height: 44,
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
