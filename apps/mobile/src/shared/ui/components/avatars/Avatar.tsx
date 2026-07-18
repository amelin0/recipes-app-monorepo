import React from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '../texts';

export interface AvatarProps {
    /** Initials shown inside the circle (RFDS avatar type=text). */
    label: string;
    /** Diameter in px. @default 48 */
    size?: number;
    /** Tap handler — the avatar becomes a button when present. */
    onPress?: () => void;
    /** Screen-reader label (required when `onPress` is set). */
    accessibilityLabel?: string;
    /** Extra styles merged onto the circle. */
    style?: StyleProp<ViewStyle>;
}

/** Circle avatar — RFDS `avatar` (type=text). Image variant arrives with real profiles. */
export const Avatar = ({ label, size = 48, onPress, accessibilityLabel, style }: AvatarProps) => {
    return (
        <Pressable
            accessibilityRole={onPress ? 'button' : 'image'}
            accessibilityLabel={accessibilityLabel ?? label}
            disabled={!onPress}
            onPress={onPress}
            style={[styles.circle(size), style]}
        >
            <AppText variant="bodyLargeBold">{label}</AppText>
        </Pressable>
    );
};

const styles = StyleSheet.create(theme => ({
    circle: (size: number) => ({
        width: size,
        height: size,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.active.tertiary,
    }),
}));
