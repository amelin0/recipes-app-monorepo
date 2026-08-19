import React, { forwardRef, useCallback, useState } from 'react';
import { TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '../texts';

type FocusHandler = NonNullable<TextInputProps['onFocus']>;
type BlurHandler = NonNullable<TextInputProps['onBlur']>;

type InputState = 'default' | 'focused' | 'invalid' | 'disabled';

export interface AppInputProps extends Omit<TextInputProps, 'style' | 'editable' | 'placeholderTextColor'> {
    /** Label rendered above the field. */
    label?: string;
    /** Helper copy rendered below the field. Hidden while `errorText` is present. */
    supportingText?: string;
    /** Error message; drives the destructive state and replaces `supportingText`. */
    errorText?: string;
    /** Character count shown under the field, right-aligned (804:25481). */
    counterText?: string;
    /** Destructive state without a message — when the error is shown elsewhere. */
    invalid?: boolean;
    /** Node rendered inside the field before the TextInput (e.g. search icon, 20px). */
    leftSlot?: React.ReactNode;
    /** Node rendered inside the field after the TextInput (e.g. clear button, 20px). */
    rightSlot?: React.ReactNode;
    /** Disables input + applies the disabled styles. @default false */
    disabled?: boolean;
    /** Extra styles merged onto the outer wrapper. */
    style?: StyleProp<ViewStyle>;
}

function resolveState(disabled: boolean, hasError: boolean, isFocused: boolean): InputState {
    if (disabled) return 'disabled';
    if (hasError) return 'invalid';
    if (isFocused) return 'focused';
    return 'default';
}

/**
 * Text field — RFDS `Input` (Figma node 54621:946).
 *
 * States: default (light border), focused (dark border), invalid (negative
 * border + negative supporting text), disabled (light-grey fill, muted text).
 */
export const AppInput = forwardRef<TextInput, AppInputProps>(function AppInput(
    {
        label,
        supportingText,
        errorText,
        counterText,
        invalid = false,
        leftSlot,
        rightSlot,
        disabled = false,
        style,
        value,
        onFocus,
        onBlur,
        ...rest
    },
    ref,
) {
    const { theme } = useUnistyles();
    const [isFocused, setIsFocused] = useState(false);

    const state = resolveState(disabled, invalid || Boolean(errorText), isFocused);

    const handleFocus = useCallback<FocusHandler>(
        event => {
            setIsFocused(true);
            onFocus?.(event);
        },
        [onFocus],
    );

    const handleBlur = useCallback<BlurHandler>(
        event => {
            setIsFocused(false);
            onBlur?.(event);
        },
        [onBlur],
    );

    const helperText = errorText ?? supportingText;
    const placeholderTextColor = disabled ? theme.colors.semantic.disabled : theme.colors.elements.tertiary;

    return (
        <View style={[styles.root, style]}>
            {label ? <AppText variant="bodyMediumBold">{label}</AppText> : null}

            <View style={styles.field(state, Boolean(rest.multiline))}>
                {leftSlot}
                <TextInput
                    ref={ref}
                    editable={!disabled}
                    value={value}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholderTextColor={placeholderTextColor}
                    style={styles.textInput(state)}
                    {...rest}
                />
                {rightSlot}
            </View>

            {helperText ? (
                <AppText variant="caption" style={styles.supporting(state)}>
                    {helperText}
                </AppText>
            ) : null}

            {counterText ? (
                <AppText variant="caption" style={[styles.supporting(state), styles.counter]}>
                    {counterText}
                </AppText>
            ) : null}
        </View>
    );
});

const styles = StyleSheet.create(theme => ({
    root: {
        gap: theme.spacing[1],
        width: '100%',
    },
    field: (state: InputState, multiline: boolean) => ({
        flexDirection: 'row',
        // A multiline field grows downwards, so its content hangs from the top.
        alignItems: multiline ? 'flex-start' : 'center',
        flex: multiline ? 1 : undefined,
        gap: theme.spacing[2],
        minHeight: 48,
        paddingHorizontal: theme.spacing[3],
        paddingVertical: theme.spacing[2],
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        backgroundColor: state === 'disabled' ? theme.colors.semantic.lightGrey : theme.colors.background.screen,
        borderColor: {
            default: theme.colors.forms.border,
            focused: theme.colors.forms.darkBorder,
            invalid: theme.colors.forms.negativeBorder,
            disabled: theme.colors.semantic.lightGrey,
        }[state],
    }),
    textInput: (state: InputState) => ({
        ...theme.typography.bodyMediumReg,
        flex: 1,
        alignSelf: 'stretch',
        padding: 0,
        textAlignVertical: 'top',
        paddingHorizontal: theme.spacing[1],
        color: state === 'disabled' ? theme.colors.semantic.disabled : theme.colors.elements.primary,
    }),
    counter: {
        width: '100%',
        textAlign: 'right',
    },
    supporting: (state: InputState) => ({
        color: {
            default: theme.colors.elements.primary,
            focused: theme.colors.elements.primary,
            invalid: theme.colors.semantic.negative,
            disabled: theme.colors.semantic.disabled,
        }[state],
    }),
}));
