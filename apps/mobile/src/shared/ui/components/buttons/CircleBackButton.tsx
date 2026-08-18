import React from 'react';
import { Pressable, type PressableProps } from 'react-native';

import { router } from 'expo-router';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { useAppTranslation } from '@/shared/utils/translations';

import ArrowLeftIcon from '../../../../../assets/icons/arrow-left.svg';

export type CircleBackButtonSize = 'sm' | 'md';

const SIZES: Record<CircleBackButtonSize, { box: number; icon: number }> = {
    /** Nav-bar variant — RFDS 686:26469. */
    sm: { box: 44, icon: 20 },
    /** Standalone footer variant — RFDS 66:2341. */
    md: { box: 52, icon: 24 },
};

export interface CircleBackButtonProps extends Omit<PressableProps, 'children' | 'style' | 'onPress'> {
    /** Screen-reader label — defaults to the localized "Back". */
    accessibilityLabel?: string;
    /** Button/icon size preset. @default 'sm' */
    size?: CircleBackButtonSize;
    /**
     * Called on press. Defaults to `router.back()` (guarded by `canGoBack`).
     * Pass a custom handler when the screen needs to short-circuit navigation.
     */
    onPress?: () => void;
}

const goBack = () => {
    if (router.canGoBack()) {
        router.back();
    }
};

/**
 * Circular back button — RFDS liquid pill (44×44, Semantic/white 30%) with an
 * arrow-left icon, used at the top of the auth screens.
 */
export const CircleBackButton = ({ accessibilityLabel, size = 'sm', onPress, ...rest }: CircleBackButtonProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation();

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? t('common:actions.back')}
            onPress={onPress ?? goBack}
            hitSlop={8}
            style={({ pressed }) => styles.base(pressed, SIZES[size].box)}
        >
            <ArrowLeftIcon width={SIZES[size].icon} height={SIZES[size].icon} color={theme.colors.elements.primary} />
        </Pressable>
    );
};

const styles = StyleSheet.create(theme => ({
    base: (pressed: boolean, box: number) => ({
        minHeight: box,
        minWidth: box,
        alignSelf: 'flex-start',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: pressed ? theme.colors.active.grey30 : theme.colors.semantic.white30,
    }),
}));
