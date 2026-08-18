import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

export interface ProgressBarProps {
    /** Progress 0..1 (clamped). */
    progress: number;
    /** Fill color. */
    color: string;
    /** Bar height in px. @default 8 */
    height?: number;
    /** Track color. @default Active/tertiary */
    trackColor?: string;
    /** Extra styles merged onto the track. */
    style?: StyleProp<ViewStyle>;
}

/** Rounded horizontal progress bar on an Active/tertiary track. */
export const ProgressBar = ({ progress, color, height = 8, trackColor, style }: ProgressBarProps) => {
    const clamped = Math.min(Math.max(progress, 0), 1);

    return (
        <View style={[styles.track(height), trackColor ? { backgroundColor: trackColor } : null, style]}>
            <View style={[styles.fill(height, clamped), { backgroundColor: color }]} />
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    track: (height: number) => ({
        width: '100%',
        height,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.active.tertiary,
        overflow: 'hidden',
    }),
    fill: (height: number, progress: number) => ({
        width: `${progress * 100}%`,
        height,
        borderRadius: theme.radius.full,
    }),
}));
