import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

export interface ScreenActionsProps {
    /** Buttons stacked with a 12 gap. */
    children: React.ReactNode;
    /** Extra styles merged onto the bar. */
    style?: StyleProp<ViewStyle>;
}

/**
 * Bottom action bar — RFDS `actions` (Figma node 686:26451). Pinned under the
 * screen content with the primary button(s) inside.
 *
 * The design fills it with Semantic/liquid at 1% plus a 2px backdrop blur;
 * over the plain white auth backgrounds that is visually inert, so it is left
 * transparent rather than pulling in a blur view for no visible effect.
 */
export const ScreenActions = ({ children, style }: ScreenActionsProps) => {
    return <View style={[styles.root, style]}>{children}</View>;
};

const styles = StyleSheet.create(theme => ({
    root: {
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[4],
        paddingBottom: theme.spacing[10],
        gap: theme.spacing[3],
    },
}));
