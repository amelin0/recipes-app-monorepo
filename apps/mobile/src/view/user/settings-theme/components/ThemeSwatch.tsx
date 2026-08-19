import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

import type { AppTheme } from '@/state/domains/app';

export interface ThemeSwatchProps {
    /** Which theme the swatch previews. */
    mode: AppTheme;
}

/** 44pt «Aa» preview of each theme (804:24776, 804:24782, 804:24788). */
export const ThemeSwatch = ({ mode }: ThemeSwatchProps) => (
    <View style={styles.box(mode)}>
        {/* System is split diagonally: light above the cut, dark below. */}
        {mode === 'System' ? <View style={styles.wedge} /> : null}
        {/* A type specimen, not copy — it stays «Aa» in every language. */}
        <AppText variant="buttonTab" style={styles.label(mode)}>
            Aa
        </AppText>
    </View>
);

const styles = StyleSheet.create(theme => ({
    box: (mode: AppTheme) => ({
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: theme.radius.sm,
        borderWidth: 1,
        borderColor: theme.colors.forms.lightBorder,
        backgroundColor: mode === 'Light' ? theme.colors.semantic.white : theme.colors.branding.primary,
    }),
    // The Figma rectangle is 58.51×33.76 rotated -46.98°, centred on (9.3, 9.9)
    // of the 44 box — i.e. it covers the top-left half. RN positions absolute
    // children inside the border, so the offsets carry that 1pt back out.
    wedge: {
        position: 'absolute',
        left: -22.45,
        top: -7.98,
        width: 58.51,
        height: 33.76,
        backgroundColor: theme.colors.semantic.white,
        transform: [{ rotate: '-46.98deg' }],
    },
    label: (mode: AppTheme) => ({
        color:
            mode === 'Light'
                ? theme.colors.elements.primary
                : mode === 'Dark'
                  ? theme.colors.semantic.white
                  : theme.colors.branding.accent,
    }),
}));
