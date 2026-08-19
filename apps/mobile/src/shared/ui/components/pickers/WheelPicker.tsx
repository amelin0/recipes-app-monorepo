import React, { useCallback, useMemo, useRef } from 'react';
import { ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '../texts';

/** Row height and the 1pt gutter between rows — RFDS `date and time wheels` (54784:4649). */
const ROW_HEIGHT = 40;
const ROW_GAP = 1;
const ROW_STRIDE = ROW_HEIGHT + ROW_GAP;
/** Three rows are visible; the middle one is the selection. */
const VISIBLE_ROWS = 3;
const VIEWPORT = ROW_HEIGHT * VISIBLE_ROWS + ROW_GAP * (VISIBLE_ROWS - 1);
/** Height of the white fade over the first/last row (54784:4678). */
const FADE_HEIGHT = 57;

export interface WheelPickerColumn {
    /** Stable key, also used as the accessibility label of the column. */
    key: string;
    /** Row labels, top to bottom. */
    items: string[];
    /** Index of the selected row. */
    selectedIndex: number;
    onChange: (index: number) => void;
}

export interface WheelPickerProps {
    columns: WheelPickerColumn[];
    /**
     * Static label between the columns — the time wheel puts a colon there
     * (882:169874).
     */
    separator?: string;
    /** Colour the top/bottom fades blend into. @default Semantic/white */
    fadeColor?: string;
    /** Drops the card chrome for a wheel already sitting inside one. */
    plain?: boolean;
}

const Column = ({ column }: { column: WheelPickerColumn }) => {
    const scrollRef = useRef<ScrollView>(null);

    const handleMomentumEnd = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const index = Math.round(event.nativeEvent.contentOffset.y / ROW_STRIDE);
            const clamped = Math.min(Math.max(index, 0), column.items.length - 1);
            if (clamped !== column.selectedIndex) column.onChange(clamped);
        },
        [column],
    );

    return (
        <View style={styles.column}>
            {/* One pill per column, pinned to the middle slot (855:100403). */}
            <View style={styles.highlight} pointerEvents="none" />

            <ScrollView
                ref={scrollRef}
                contentContainerStyle={styles.columnContent}
                showsVerticalScrollIndicator={false}
                snapToInterval={ROW_STRIDE}
                decelerationRate="fast"
                contentOffset={{ x: 0, y: column.selectedIndex * ROW_STRIDE }}
                onMomentumScrollEnd={handleMomentumEnd}
                accessibilityLabel={column.key}
            >
                {column.items.map((label, index) => (
                    <View key={label} style={styles.row}>
                        <AppText
                            variant={index === column.selectedIndex ? 'bodyLargeBold' : 'bodyLargeReg'}
                            style={styles.rowLabel(index === column.selectedIndex)}
                        >
                            {label}
                        </AppText>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

/**
 * Scrollable wheel with the selection pinned to the middle row — RFDS `wheel`
 * (Figma 855:100403). The highlight pill and the white fades are fixed
 * overlays; only the labels move, which is what keeps the settled state
 * identical to the design while scrolling stays readable.
 */
export const WheelPicker = ({ columns, separator, fadeColor, plain = false }: WheelPickerProps) => {
    const { theme } = useUnistyles();
    const white = fadeColor ?? theme.colors.semantic.white;

    const fades = useMemo(
        () => (
            <>
                <Svg style={styles.fadeTop} width="100%" height={FADE_HEIGHT} pointerEvents="none">
                    <Defs>
                        <LinearGradient id="wheelFadeTop" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={white} stopOpacity="1" />
                            <Stop offset="1" stopColor={white} stopOpacity="0" />
                        </LinearGradient>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height={FADE_HEIGHT} fill="url(#wheelFadeTop)" />
                </Svg>
                <Svg style={styles.fadeBottom} width="100%" height={FADE_HEIGHT} pointerEvents="none">
                    <Defs>
                        <LinearGradient id="wheelFadeBottom" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={white} stopOpacity="0" />
                            <Stop offset="1" stopColor={white} stopOpacity="1" />
                        </LinearGradient>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height={FADE_HEIGHT} fill="url(#wheelFadeBottom)" />
                </Svg>
            </>
        ),
        [white],
    );

    return (
        // The shadow lives on the outer view: iOS drops it entirely when the
        // same view clips with `overflow: hidden`, which the rounded inner box
        // needs.
        <View style={plain ? undefined : styles.card}>
            <View style={styles.clip}>
                <View style={styles.viewport}>
                    <View style={styles.columns(columns.length)}>
                        {columns.map((column, index) => (
                            <React.Fragment key={column.key}>
                                {separator && index > 0 ? (
                                    <View style={styles.separator}>
                                        <AppText variant="bodyLargeBold">{separator}</AppText>
                                    </View>
                                ) : null}
                                <Column column={column} />
                            </React.Fragment>
                        ))}
                    </View>
                </View>

                {fades}
            </View>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    card: {
        width: '100%',
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.semantic.white,
        ...theme.shadow.block,
    },
    clip: {
        padding: theme.spacing[4],
        borderRadius: theme.radius.xl,
        overflow: 'hidden',
    },
    viewport: {
        height: VIEWPORT,
    },
    // A lone column is centred; several spread across the card (855:101071 vs
    // 855:100403).
    columns: (count: number) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: count > 1 ? 'space-between' : 'center',
        height: VIEWPORT,
    }),
    separator: {
        height: ROW_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing[2],
    },
    column: {
        width: 100,
        height: VIEWPORT,
    },
    columnContent: {
        // One row of padding at each end so the first and last item can reach
        // the middle slot.
        paddingVertical: ROW_STRIDE,
        gap: ROW_GAP,
    },
    row: {
        height: ROW_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowLabel: (selected: boolean) => ({
        color: selected ? theme.colors.elements.primary : theme.colors.semantic.darkGrey,
    }),
    // Fixed pill over the middle row.
    highlight: {
        position: 'absolute',
        top: ROW_STRIDE,
        left: 0,
        right: 0,
        height: ROW_HEIGHT,
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: theme.colors.semantic.positive,
        backgroundColor: theme.colors.semantic.lightPositive,
    },
    fadeTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    fadeBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
}));
