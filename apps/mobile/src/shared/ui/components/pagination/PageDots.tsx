import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

/**
 * `sm` — step carousels inside a card (meal details, node 594:33625).
 * `lg` — full-screen carousels (onboarding, nodes 66:2252…66:2316).
 */
export type PageDotsSize = 'sm' | 'lg';

export interface PageDotsProps {
    count: number;
    activeIndex: number;
    /** @default 'sm' */
    size?: PageDotsSize;
    /** Screen-reader label, e.g. «слайд 2 з 5». */
    accessibilityLabel?: string;
    style?: StyleProp<ViewStyle>;
}

/** Carousel pagination dots — the active dot stretches into a dark pill. */
export const PageDots = ({ count, activeIndex, size = 'sm', accessibilityLabel, style }: PageDotsProps) => {
    return (
        <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={accessibilityLabel}
            accessibilityValue={{ min: 1, max: count, now: activeIndex + 1 }}
            style={[styles.row(size), style]}
        >
            {Array.from({ length: count }).map((_, index) => (
                <View key={index} style={styles.dot(index === activeIndex, size)} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    row: (size: PageDotsSize) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: size === 'lg' ? theme.spacing[3] : theme.spacing[2],
    }),
    dot: (active: boolean, size: PageDotsSize) => ({
        width: active ? (size === 'lg' ? 32 : 24) : 8,
        height: 8,
        borderRadius: theme.radius.full,
        backgroundColor: active ? theme.colors.branding.primary : theme.colors.branding.disabled,
    }),
}));
