import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import type { TypographyVariant } from '@/shared/ui/theme';

import { AppText } from '../texts';

export interface AvatarProps {
    /** Initials shown inside the circle (RFDS avatar type=text). */
    label: string;
    /** Diameter in px. @default 48 */
    size?: number;
    /** Typography of the initials — larger avatars use bigger type. @default 'bodyLargeBold' */
    labelVariant?: TypographyVariant;
    /** Tap handler — the avatar becomes a button when present. */
    onPress?: () => void;
    /** Screen-reader label (required when `onPress` is set). */
    accessibilityLabel?: string;
    /** Node pinned to the bottom-right corner, e.g. the edit affordance (804:24621). */
    badge?: React.ReactNode;
    /** Extra styles merged onto the circle. */
    style?: StyleProp<ViewStyle>;
}

/** Circle avatar — RFDS `avatar` (type=text). Image variant arrives with real profiles. */
export const Avatar = ({
    label,
    size = 48,
    labelVariant = 'bodyLargeBold',
    onPress,
    accessibilityLabel,
    badge,
    style,
}: AvatarProps) => {
    return (
        <Pressable
            accessibilityRole={onPress ? 'button' : 'image'}
            accessibilityLabel={accessibilityLabel ?? label}
            disabled={!onPress}
            onPress={onPress}
            style={[styles.circle(size), style]}
        >
            <AppText variant={labelVariant}>{label}</AppText>
            {badge ? <View style={styles.badge}>{badge}</View> : null}
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
    // The design hangs the badge just outside the circle (804:24621).
    badge: {
        position: 'absolute',
        right: -2.5,
        bottom: -3,
    },
}));
