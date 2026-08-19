import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';
import type { TypographyVariant } from '@/shared/ui/theme';

export interface SetupHeaderProps {
    title: string;
    /** Why the app is asking — every question in the design carries one. */
    subtitle?: string;
    /**
     * Questions draw the supporting copy at 14; the illustrated pitch steps use
     * 16 (864:111963, 864:114912). @default 'bodyMediumReg'
     */
    subtitleVariant?: TypographyVariant;
}

/** Centered question header — RFDS `Header` 13:9627 (title/medium + body/small). */
export const SetupHeader = ({ title, subtitle, subtitleVariant = 'bodyMediumReg' }: SetupHeaderProps) => {
    return (
        <View style={styles.root}>
            <AppText variant="titleMedium" accessibilityRole="header" style={styles.centered}>
                {title}
            </AppText>
            {subtitle ? (
                <AppText variant={subtitleVariant} style={[styles.centered, styles.subtitle]}>
                    {subtitle}
                </AppText>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    root: {
        width: '100%',
        alignItems: 'center',
        gap: theme.spacing[1],
    },
    centered: {
        width: '100%',
        textAlign: 'center',
    },
    subtitle: {
        color: theme.colors.semantic.darkGrey,
    },
}));
