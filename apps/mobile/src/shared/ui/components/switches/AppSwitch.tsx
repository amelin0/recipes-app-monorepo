import React from 'react';
import { Pressable } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

/**
 * Two switchers live in the design: the RFDS one fills with Branding/accent
 * (54714:635), while the reminders list uses Semantic/positive (848:23711).
 */
export type AppSwitchTone = 'accent' | 'positive';

export interface AppSwitchProps {
    value: boolean;
    onValueChange: (value: boolean) => void;
    /** Screen-reader label. */
    accessibilityLabel?: string;
    disabled?: boolean;
    /** @default 'accent' */
    tone?: AppSwitchTone;
}

/** Toggle — RFDS `switcher` (node 54714:635): 50×28 track, white thumb. */
export const AppSwitch = ({
    value,
    onValueChange,
    accessibilityLabel,
    disabled = false,
    tone = 'accent',
}: AppSwitchProps) => {
    return (
        <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: value, disabled }}
            accessibilityLabel={accessibilityLabel}
            disabled={disabled}
            hitSlop={8}
            onPress={() => onValueChange(!value)}
            style={styles.track(value, disabled, tone)}
        >
            <Pressable style={styles.thumb(value)} pointerEvents="none" />
        </Pressable>
    );
};

const styles = StyleSheet.create(theme => ({
    track: (on: boolean, disabled: boolean, tone: AppSwitchTone) => ({
        width: 50,
        height: 28,
        padding: 2,
        borderRadius: theme.radius.full,
        backgroundColor: on
            ? tone === 'positive'
                ? theme.colors.semantic.positive
                : theme.colors.branding.accent
            : theme.colors.active.tertiary,
        justifyContent: 'center',
        opacity: disabled ? 0.5 : 1,
    }),
    thumb: (on: boolean) => ({
        width: 24,
        height: 24,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.white,
        alignSelf: on ? 'flex-end' : 'flex-start',
        ...theme.shadow.sm,
    }),
}));
