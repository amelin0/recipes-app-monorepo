import React from 'react';
import { Pressable, type PressableProps } from 'react-native';

import { router } from 'expo-router';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { useAppTranslation } from '@/shared/utils/translations';

import ArrowLeftIcon from '../../../../../assets/icons/arrow-left.svg';

export interface CircleBackButtonProps extends Omit<PressableProps, 'children' | 'style' | 'onPress'> {
    /** Screen-reader label — defaults to the localized "Back". */
    accessibilityLabel?: string;
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
export const CircleBackButton = ({ accessibilityLabel, onPress, ...rest }: CircleBackButtonProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation();

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? t('common:actions.back')}
            onPress={onPress ?? goBack}
            hitSlop={8}
            style={({ pressed }) => styles.base(pressed)}
        >
            <ArrowLeftIcon width={20} height={20} color={theme.colors.elements.primary} />
        </Pressable>
    );
};

const styles = StyleSheet.create(theme => ({
    base: (pressed: boolean) => ({
        minHeight: 44,
        minWidth: 44,
        alignSelf: 'flex-start',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: pressed ? theme.colors.active.grey30 : theme.colors.semantic.white30,
    }),
}));
