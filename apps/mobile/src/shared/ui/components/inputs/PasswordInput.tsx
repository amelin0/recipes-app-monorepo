import React, { forwardRef, useCallback, useState } from 'react';
import { Pressable, type TextInput } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useUnistyles } from 'react-native-unistyles';

import { useAppTranslation } from '@/shared/utils/translations';

import EyeOpenIcon from '../../../../../assets/icons/auth/eye-open.svg';

import { AppInput, type AppInputProps } from './AppInput';

export interface PasswordInputProps extends Omit<AppInputProps, 'secureTextEntry' | 'rightSlot' | 'autoComplete'> {
    /** Accessibility label for the show-password toggle. */
    toggleAccessibilityLabel?: string;
    /** Override autoComplete. Defaults to `password`; pass `new-password` for signup forms. */
    autoComplete?: 'password' | 'new-password' | 'current-password';
}

/**
 * Password field with a built-in show/hide toggle. Wraps `AppInput` and swaps
 * the right slot between open/closed eye icons — visibility state is local.
 */
export const PasswordInput = forwardRef<TextInput, PasswordInputProps>(function PasswordInput(
    { toggleAccessibilityLabel, autoComplete = 'password', disabled, ...rest },
    ref,
) {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation();
    const [isVisible, setIsVisible] = useState(false);

    const toggle = useCallback(() => setIsVisible(prev => !prev), []);

    const iconColor = disabled ? theme.colors.semantic.disabled : theme.colors.elements.tertiary;

    return (
        <AppInput
            ref={ref}
            secureTextEntry={!isVisible}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={autoComplete}
            disabled={disabled}
            rightSlot={
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={toggleAccessibilityLabel ?? t('common:a11y.toggle-password')}
                    hitSlop={8}
                    onPress={toggle}
                    disabled={disabled}
                >
                    {isVisible ? (
                        // TODO: replace with the RFDS "closed eye" SVG once exported from Figma.
                        <Ionicons name="eye-off-outline" size={20} color={iconColor} />
                    ) : (
                        <EyeOpenIcon width={20} height={20} color={iconColor} />
                    )}
                </Pressable>
            }
            {...rest}
        />
    );
});
