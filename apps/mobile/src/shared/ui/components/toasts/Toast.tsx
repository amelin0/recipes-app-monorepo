import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '../texts';

export type ToastVariant = 'default' | 'success' | 'negative' | 'warning';

export interface ToastProps {
    /** Color theme. @default 'default' */
    variant?: ToastVariant;
    /** Body copy. */
    text: string;
    /** Action label (e.g. "Скасувати"). Hides if omitted. */
    actionLabel?: string;
    /** Called when the action button is pressed. */
    onAction?: () => void;
}

/**
 * Toast / snackbar — RFDS `Snackbar` (node 13:10103, e.g. 435:12669): compact
 * colored bar with body/medium-reg copy, no icons. Used by the global
 * `ToastService` — consumers call `ToastService.success('...')` rather than
 * rendering this directly.
 */
export const Toast = ({ variant = 'default', text, actionLabel, onAction }: ToastProps) => {
    const { theme } = useUnistyles();
    const contentColor = variant === 'warning' ? theme.colors.elements.primary : theme.colors.semantic.white;

    return (
        <View style={styles.base(variant)}>
            <AppText variant="bodyMediumReg" style={[styles.message, { color: contentColor }]}>
                {text}
            </AppText>

            {actionLabel ? (
                <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
                    <AppText variant="buttonSmall" style={{ color: contentColor }}>
                        {actionLabel}
                    </AppText>
                </Pressable>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    base: (variant: ToastVariant) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        marginHorizontal: theme.spacing[4],
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[2],
        borderRadius: theme.radius.lg,
        backgroundColor: {
            default: theme.colors.branding.primary,
            success: theme.colors.semantic.positive,
            negative: theme.colors.semantic.negative,
            warning: theme.colors.semantic.orange,
        }[variant],
        ...theme.shadow.block,
    }),
    message: {
        flex: 1,
    },
}));
