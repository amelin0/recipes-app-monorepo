import React from 'react';
import { ActivityIndicator, Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '../texts';

export type AppButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost' | 'liquid';
export type AppButtonSize = 'lg' | 'md';

type ThemeColors = ReturnType<typeof useUnistyles>['theme']['colors'];

/**
 * Label / spinner color per the RFDS Button matrix (node 13:9311): disabled is
 * always Semantic/disabled; primary is white on the accent fill in every state;
 * pressed secondary flips to white; everything else is Elements/primary.
 */
const contentColor = (colors: ThemeColors, variant: AppButtonVariant, pressed: boolean, disabled: boolean): string => {
    if (disabled) return colors.semantic.disabled;
    if (variant === 'primary' || variant === 'destructive') return colors.semantic.white;
    if (variant === 'secondary' && pressed) return colors.semantic.white;
    return colors.elements.primary;
};

export interface AppButtonProps extends Omit<PressableProps, 'children' | 'style' | 'disabled' | 'onPress'> {
    /** Text shown inside the button. */
    label: string;
    /** Called when the user presses the button. Not invoked while `disabled` or `isLoading`. */
    onPress: () => void;
    /**
     * Visual style — RFDS `Button` (Figma node 54621:944).
     *
     * - `primary` — solid Branding/accent, white label; pressed = Active/primary.
     * - `secondary` — solid Semantic/light grey; pressed = Active/secondary (label turns white).
     * - `destructive` — solid Semantic/negative, white label; pressed = Active/negative (804:24945).
     * - `ghost` — transparent; pressed = Active/tertiary.
     * - `liquid` — Semantic/white 30% over imagery; pressed = Active/grey 30%.
     *   (Figma adds a glass blur — add expo-blur behind the button if a screen needs it.)
     *
     * @default 'primary'
     */
    variant?: AppButtonVariant;
    /**
     * Size preset — drives min height and typography.
     *
     * - `lg` — 52px, `buttonLarge` (Inter SemiBold 16).
     * - `md` — 44px, `buttonSmall` (Inter SemiBold 14).
     *
     * @default 'lg'
     */
    size?: AppButtonSize;
    /** Disables interaction and applies muted styles. @default false */
    disabled?: boolean;
    /** Replaces the label with a spinner and blocks taps. @default false */
    isLoading?: boolean;
    /** Stretches the button to fill the parent container's width. @default false */
    fullWidth?: boolean;
    /** Optional node rendered before the label (e.g. icon, 24px). */
    leftSlot?: React.ReactNode;
    /** Optional node rendered after the label (e.g. icon, 24px). */
    rightSlot?: React.ReactNode;
    /** Extra styles merged onto the outer Pressable. */
    style?: StyleProp<ViewStyle>;
}

export const AppButton = ({
    label,
    onPress,
    variant = 'primary',
    size = 'lg',
    disabled = false,
    isLoading = false,
    fullWidth = false,
    leftSlot,
    rightSlot,
    style,
    ...pressableProps
}: AppButtonProps) => {
    const { theme } = useUnistyles();
    const isInteractive = !disabled && !isLoading;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !isInteractive, busy: isLoading }}
            disabled={!isInteractive}
            onPress={onPress}
            style={({ pressed }) => [styles.base(variant, size, pressed, !isInteractive, fullWidth), style]}
            {...pressableProps}
        >
            {({ pressed }) => {
                const color = contentColor(theme.colors, variant, pressed, !isInteractive);

                return isLoading ? (
                    <ActivityIndicator color={color} size="small" />
                ) : (
                    <>
                        {leftSlot ? <View>{leftSlot}</View> : null}
                        <AppText
                            numberOfLines={1}
                            variant={size === 'lg' ? 'buttonLarge' : 'buttonSmall'}
                            style={[styles.label, { color }]}
                        >
                            {label}
                        </AppText>
                        {rightSlot ? <View>{rightSlot}</View> : null}
                    </>
                );
            }}
        </Pressable>
    );
};

const styles = StyleSheet.create(theme => ({
    base: (
        variant: AppButtonVariant,
        size: AppButtonSize,
        pressed: boolean,
        disabled: boolean,
        fullWidth: boolean,
    ) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[2],
        padding: theme.spacing[2],
        borderRadius: theme.radius.full,
        overflow: 'hidden',
        minHeight: size === 'lg' ? 52 : 44,
        minWidth: size === 'lg' ? 52 : 44,
        alignSelf: fullWidth ? 'stretch' : 'flex-start',
        backgroundColor: disabled
            ? {
                  primary: theme.colors.semantic.lightGrey,
                  secondary: theme.colors.semantic.lightGrey,
                  destructive: theme.colors.semantic.lightGrey,
                  ghost: 'transparent',
                  liquid: theme.colors.semantic.white30,
              }[variant]
            : pressed
              ? {
                    primary: theme.colors.active.primary,
                    secondary: theme.colors.active.secondary,
                    destructive: theme.colors.active.negative,
                    ghost: theme.colors.active.tertiary,
                    liquid: theme.colors.active.grey30,
                }[variant]
              : {
                    primary: theme.colors.branding.accent,
                    secondary: theme.colors.semantic.lightGrey,
                    destructive: theme.colors.semantic.negative,
                    ghost: 'transparent',
                    liquid: theme.colors.semantic.white30,
                }[variant],
    }),
    label: {
        paddingHorizontal: theme.spacing[1],
        textAlign: 'center',
    },
}));
