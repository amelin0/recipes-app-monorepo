import React from 'react';
import { Image, useWindowDimensions, View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

/** Full splash frame exported from Figma (RF-mobile-app 66:2250), 375×812 @3x. */
const SPLASH = require('../../../../../assets/images/brand/splash-full.png');

/**
 * Branded launch screen.
 *
 * The native launch screen is a flat Branding/accent fill and this view paints
 * the artwork on top, so the hand-off is invisible. The whole frame is used as
 * one image rather than a cropped lockup: the mascot sits inside a wide, soft
 * glow, and any crop tight enough to size the mascot correctly would clip that
 * glow into a visible rectangle. `cover` keeps the composition proportional —
 * the frame's margins are flat accent, so cropping them costs nothing.
 */
export const AppSplash = () => {
    const { width, height } = useWindowDimensions();

    return (
        <View style={styles.screen}>
            <Image source={SPLASH} style={styles.artwork(width, height)} resizeMode="cover" />
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    screen: {
        flex: 1,
        backgroundColor: theme.colors.branding.accent,
    },
    // Sized from the viewport rather than the layout: an <Image> falls back to
    // the asset's pixel dimensions when it has no explicit size, which would
    // blow the 1125×2436 export up to that many points.
    artwork: (width: number, height: number) => ({
        width,
        height,
    }),
}));
