import React from 'react';
import { Pressable, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '../texts';

export type ToastVariant = 'default' | 'success' | 'negative' | 'warning';

export interface ToastProps {
    /** Color theme. @default 'default' */
    variant?: ToastVariant;
    /** Body copy. */
    text: string;
    /** Show the leading info icon. @default true */
    leadingIcon?: boolean;
    /** Action label (e.g. "Скасувати"). Hides if omitted. */
    actionLabel?: string;
    /** Called when the action button is pressed. */
    onAction?: () => void;
    /** Show a trailing close button. @default true */
    closable?: boolean;
    /** Called when the user taps the close button. */
    onClose?: () => void;
}

/**
 * Toast / snackbar bar. Used by the global `ToastService` — consumers
 * call `ToastService.success('...')` rather than rendering this directly.
 */
export const Toast = ({
    variant = 'default',
    text,
    leadingIcon = true,
    actionLabel,
    onAction,
    closable = true,
    onClose,
}: ToastProps) => {
    const { theme } = useUnistyles();
    const contentColor = CONTENT_COLOR[variant](theme.colors);

    return (
        <View style={styles.base(variant)}>
            {leadingIcon ? <Ionicons name="information-circle-outline" size={24} color={contentColor} /> : null}

            <AppText variant="bodySmallReg" style={[styles.message, { color: contentColor }]}>
                {text}
            </AppText>

            {actionLabel ? (
                <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8} style={styles.action}>
                    <AppText variant="buttonSmall" style={{ color: contentColor }}>
                        {actionLabel}
                    </AppText>
                </Pressable>
            ) : null}

            {closable ? (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Закрити"
                    onPress={onClose}
                    hitSlop={8}
                    style={styles.action}
                >
                    <Ionicons name="close" size={24} color={contentColor} />
                </Pressable>
            ) : null}
        </View>
    );
};

type ThemeColors = ReturnType<typeof useUnistyles>['theme']['colors'];

const CONTENT_COLOR: Record<ToastVariant, (colors: ThemeColors) => string> = {
    default: colors => colors.semantic.white,
    success: colors => colors.semantic.white,
    negative: colors => colors.semantic.white,
    warning: colors => colors.semantic.white,
};

const styles = StyleSheet.create(theme => ({
    base: (variant: ToastVariant) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        minHeight: 48,
        marginHorizontal: theme.spacing[4],
        paddingHorizontal: theme.spacing[3],
        paddingVertical: theme.spacing[2],
        borderRadius: theme.radius.lg,
        backgroundColor: {
            default: theme.colors.branding.primary,
            success: theme.colors.semantic.positive,
            negative: theme.colors.semantic.negative,
            warning: theme.colors.semantic.orange,
        }[variant],
        ...theme.shadow.md,
    }),
    message: {
        flex: 1,
    },
    action: {
        minHeight: 36,
        minWidth: 44,
        paddingHorizontal: theme.spacing[1],
        paddingVertical: theme.spacing[2],
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
    },
}));
