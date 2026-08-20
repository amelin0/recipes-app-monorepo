import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { CircleBackButton } from '../buttons';
import { AppText } from '../texts';

export interface TopBarProps {
    /** Centered title — RFDS nav bar (body/large-bold). */
    title?: string;
    /** Optional line under the title, e.g. «Категорія» (594:43293). */
    subtitle?: string;
    /** Hides the back button when the screen is a flow endpoint. @default true */
    showBack?: boolean;
    /** Overrides the default `router.back()` of the back button. */
    onBack?: () => void;
    /** Action on the trailing edge, e.g. the help button (1000:79427). */
    trailing?: React.ReactNode;
}

/**
 * Navigation bar — RFDS nav row (Figma node 686:26467): back button on the
 * leading edge, centered title, and a 44×36 trailing spacer that balances the
 * button so the title stays optically centered.
 */
export const TopBar = ({ title, subtitle, showBack = true, onBack, trailing }: TopBarProps) => {
    return (
        <View style={styles.root}>
            <View style={styles.leading}>{showBack ? <CircleBackButton onPress={onBack} /> : null}</View>

            {title ? (
                <View style={styles.titleBlock}>
                    <AppText variant="bodyLargeBold" accessibilityRole="header" numberOfLines={1}>
                        {title}
                    </AppText>
                    {subtitle ? (
                        <AppText variant="bodySmallReg" numberOfLines={1} style={styles.subtitle}>
                            {subtitle}
                        </AppText>
                    ) : null}
                </View>
            ) : null}

            <View style={styles.trailing}>{trailing}</View>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    root: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing[4],
        // The 804:* screens hang the row directly under a 62pt status bar, i.e.
        // flush with the real safe-area inset — no padding of its own. (The
        // older 686:26467 node measured 14 below a 48pt bar, which is what the
        // previous 12pt token was compensating for.)
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
    titleBlock: {
        alignItems: 'center',
    },
    subtitle: {
        color: theme.colors.semantic.darkGrey,
    },
    trailing: {
        width: 44,
        minHeight: 36,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
}));
