import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { CircleBackButton } from '../buttons';
import { AppText } from '../texts';

export interface TopBarProps {
    /** Centered title — RFDS nav bar (body/large-bold). */
    title?: string;
    /** Hides the back button when the screen is a flow endpoint. @default true */
    showBack?: boolean;
    /** Overrides the default `router.back()` of the back button. */
    onBack?: () => void;
}

/**
 * Navigation bar — RFDS nav row (Figma node 686:26467): back button on the
 * leading edge, centered title, and a 44×36 trailing spacer that balances the
 * button so the title stays optically centered.
 */
export const TopBar = ({ title, showBack = true, onBack }: TopBarProps) => {
    return (
        <View style={styles.root}>
            <View style={styles.leading}>{showBack ? <CircleBackButton onPress={onBack} /> : null}</View>

            {title ? (
                <AppText variant="bodyLargeBold" accessibilityRole="header" numberOfLines={1}>
                    {title}
                </AppText>
            ) : null}

            <View style={styles.trailing} />
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    root: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing[4],
        // The design hangs the row 14 below a 48px status bar; 12 is the token
        // that lands on it once the real safe-area inset (≈50 on this device
        // class) is taken into account.
        paddingTop: theme.spacing[3],
        paddingBottom: theme.spacing[2],
        backgroundColor: theme.colors.background.screen,
    },
    // Both sides reserve the same width, otherwise `space-between` would push
    // the title off-centre as soon as the back button is hidden. Only the
    // trailing spacer is height-capped — giving the leading slot a height would
    // squash the 44px back button and shrink the whole row.
    leading: {
        width: 44,
        justifyContent: 'center',
    },
    trailing: {
        width: 44,
        height: 36,
    },
}));
