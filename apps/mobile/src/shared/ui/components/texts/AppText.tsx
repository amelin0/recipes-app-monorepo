import React from 'react';
import { Text, type TextProps } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import type { colors, TypographyVariant } from '@/shared/ui/theme';

type TextColor = keyof typeof colors.elements;

export interface AppTextProps extends TextProps {
    /** Typography token. @default 'bodyMediumReg' */
    variant?: TypographyVariant;
    /** Text color token. @default 'primary' */
    color?: TextColor;
}

export const AppText = ({ variant = 'bodyMediumReg', color = 'primary', style, ...rest }: AppTextProps) => {
    return <Text style={[styles.text(variant, color), style]} {...rest} />;
};

const styles = StyleSheet.create(theme => ({
    text: (variant: TypographyVariant, color: TextColor) => ({
        ...theme.typography[variant],
        color: theme.colors.elements[color],
    }),
}));
