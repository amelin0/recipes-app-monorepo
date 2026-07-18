import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
    TextInput,
    View,
    type NativeSyntheticEvent,
    type StyleProp,
    type TextInputKeyPressEventData,
    type TextInputProps,
    type ViewStyle,
} from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { useAppTranslation } from '@/shared/utils/translations';

import { AppText } from '../texts';

export type OtpInputState = 'default' | 'error';

export interface OtpInputRef {
    focus: () => void;
    blur: () => void;
    clear: () => void;
}

export interface OtpInputProps extends Omit<
    TextInputProps,
    'style' | 'value' | 'onChangeText' | 'maxLength' | 'keyboardType'
> {
    /** Current OTP value (digits only). */
    value: string;
    /** Called on every change — always normalized to digits and clamped to `length`. */
    onChangeText: (value: string) => void;
    /** Called when the user has entered the full code. */
    onComplete?: (value: string) => void;
    /** Number of cells. @default 6 */
    length?: number;
    /** Visual state. @default 'default' */
    state?: OtpInputState;
    /** Disables input + applies the disabled styles. @default false */
    disabled?: boolean;
    /** Extra styles merged onto the outer wrapper. */
    style?: StyleProp<ViewStyle>;
}

/**
 * OTP code input — RFDS `code` (Figma node 66:2537). An invisible TextInput
 * stretched over the whole cell row drives N visual cells (44×56,
 * Semantic/secondary fill, active cell gets a 2px Branding/secondary border
 * and a fake caret). The full-bleed overlay keeps native behavior working:
 * tap-to-focus, long-press → Paste, screen-reader focus.
 */
export const OtpInput = forwardRef<OtpInputRef, OtpInputProps>(function OtpInput(
    {
        value,
        onChangeText,
        onComplete,
        length = 6,
        state = 'default',
        disabled = false,
        style,
        autoFocus,
        onFocus,
        onBlur,
        accessibilityLabel,
        ...rest
    },
    ref,
) {
    const { t } = useAppTranslation();
    const inputRef = useRef<TextInput>(null);
    const [isFocused, setIsFocused] = useState(false);

    useImperativeHandle(
        ref,
        () => ({
            focus: () => inputRef.current?.focus(),
            blur: () => inputRef.current?.blur(),
            clear: () => onChangeText(''),
        }),
        [onChangeText],
    );

    // React Native's built-in `autoFocus` drops the focus when the component
    // mounts during a navigation transition. Defer one tick past the animation
    // so the keyboard opens reliably on screen arrival.
    useEffect(() => {
        if (!autoFocus || disabled) return;
        const id = setTimeout(() => inputRef.current?.focus(), 150);
        return () => clearTimeout(id);
    }, [autoFocus, disabled]);

    const handleChange = useCallback(
        (raw: string) => {
            const digits = raw.replace(/\D/g, '').slice(0, length);
            onChangeText(digits);
            if (digits.length === length) {
                onComplete?.(digits);
            }
        },
        [length, onChangeText, onComplete],
    );

    const handleFocus = useCallback<NonNullable<TextInputProps['onFocus']>>(
        event => {
            setIsFocused(true);
            onFocus?.(event);
        },
        [onFocus],
    );

    const handleBlur = useCallback<NonNullable<TextInputProps['onBlur']>>(
        event => {
            setIsFocused(false);
            onBlur?.(event);
        },
        [onBlur],
    );

    const handleKeyPress = useCallback(
        (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
            if (event.nativeEvent.key === 'Backspace' && value.length > 0) {
                onChangeText(value.slice(0, -1));
            }
        },
        [onChangeText, value],
    );

    const activeIndex = value.length;
    const cells = useMemo(() => Array.from({ length }), [length]);

    return (
        <View style={[styles.root, style]}>
            <View style={styles.cells} accessible={false} importantForAccessibility="no-hide-descendants">
                {cells.map((_, index) => {
                    const char = value[index] ?? '';
                    const isCellFocused =
                        isFocused &&
                        !disabled &&
                        (index === activeIndex || (index === length - 1 && activeIndex === length));

                    return (
                        <View key={index} style={styles.cell(state, isCellFocused, disabled)}>
                            {char ? (
                                <AppText variant="bodyLargeReg" style={styles.char(disabled)}>
                                    {char}
                                </AppText>
                            ) : isCellFocused ? (
                                <View style={styles.caret} />
                            ) : null}
                        </View>
                    );
                })}
            </View>

            <TextInput
                ref={inputRef}
                value={value}
                onChangeText={handleChange}
                onKeyPress={handleKeyPress}
                onFocus={handleFocus}
                onBlur={handleBlur}
                editable={!disabled}
                keyboardType="number-pad"
                maxLength={length}
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                importantForAutofill="yes"
                caretHidden
                accessibilityLabel={accessibilityLabel ?? t('common:a11y.otp-code')}
                accessibilityValue={{ text: `${value.length}/${length}` }}
                style={styles.overlayInput}
                {...rest}
            />
        </View>
    );
});

const styles = StyleSheet.create(theme => ({
    root: {
        width: '100%',
    },
    cells: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    cell: (state: OtpInputState, isCellFocused: boolean, disabled: boolean) => ({
        width: 44,
        height: 56,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.semantic.lightGrey,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: isCellFocused || state === 'error' ? 2 : 0,
        borderColor:
            state === 'error'
                ? theme.colors.forms.negativeBorder
                : isCellFocused
                  ? theme.colors.branding.secondary
                  : 'transparent',
        opacity: disabled ? 0.5 : 1,
    }),
    char: (disabled: boolean) => ({
        color: disabled ? theme.colors.semantic.disabled : theme.colors.elements.primary,
    }),
    caret: {
        width: 1.5,
        height: 22,
        backgroundColor: theme.colors.elements.primary,
    },
    // Full-bleed invisible overlay: keeps native tap-to-focus, the iOS/Android
    // long-press Paste menu, and screen-reader focus working. Near-zero (not
    // zero) opacity + transparent color so nothing is visibly rendered.
    overlayInput: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.02,
        color: 'transparent',
    },
}));
