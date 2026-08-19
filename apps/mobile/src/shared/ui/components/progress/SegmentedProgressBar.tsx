import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export interface SegmentedProgressBarProps {
    /** Total number of segments. @default 10 */
    segments?: number;
    /**
     * How many segments are filled (clamped to `segments`). Fractional values
     * partly fill the segment they land in — 240 of 2000 ml is 1.2 segments,
     * which the design draws as one full pill and a stub (435:6152).
     */
    filled: number;
    /** Fill color. Defaults to Semantic/ocean. */
    color?: string;
    /** Segment height in px. @default 8 */
    height?: number;
    /** Extra styles merged onto the row. */
    style?: StyleProp<ViewStyle>;
}

/** Row of rounded segments — the water tracker bar on Home. */
export const SegmentedProgressBar = ({
    segments = 10,
    filled,
    color,
    height = 8,
    style,
}: SegmentedProgressBarProps) => {
    const { theme } = useUnistyles();
    const fillColor = color ?? theme.colors.semantic.ocean;
    const clamped = Math.min(Math.max(filled, 0), segments);

    return (
        <View style={[styles.row, style]}>
            {Array.from({ length: segments }).map((_, index) => {
                const share = Math.min(Math.max(clamped - index, 0), 1);

                return (
                    <View key={index} style={styles.segment(height)}>
                        {share > 0 ? (
                            <View style={[styles.fill(height, share), { backgroundColor: fillColor }]} />
                        ) : null}
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
        width: '100%',
    },
    segment: (height: number) => ({
        flex: 1,
        height,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.active.tertiary,
        overflow: 'hidden',
    }),
    fill: (height: number, share: number) => ({
        height,
        // A part-filled segment keeps the rounded left cap and is cut square on
        // the right by the segment's own clip — that is how Figma draws it.
        width: `${share * 100}%`,
        borderRadius: theme.radius.full,
    }),
}));
