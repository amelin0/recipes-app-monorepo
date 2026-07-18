import React from 'react';
import type { ViewProps } from 'react-native';

import { type Edge, SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';

// Third-party component — must be wrapped so theme changes (setTheme) re-apply
// the themed background; the babel plugin only auto-tracks react-native views.
const UniSafeAreaView = withUnistyles(SafeAreaView);

export interface AppScreenProps extends ViewProps {
    /** Safe-area edges to pad. Bottom is owned by the tab bar. @default ['top'] */
    edges?: readonly Edge[];
}

export const AppScreen = ({ edges = ['top'], style, children, ...rest }: AppScreenProps) => {
    return (
        <UniSafeAreaView edges={edges} style={[styles.screen, style]} {...rest}>
            {children}
        </UniSafeAreaView>
    );
};

const styles = StyleSheet.create(theme => ({
    screen: {
        flex: 1,
        backgroundColor: theme.colors.background.screen,
    },
}));
