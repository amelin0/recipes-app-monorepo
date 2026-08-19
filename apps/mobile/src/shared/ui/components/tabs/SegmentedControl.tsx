import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '../texts';

export interface SegmentedControlItem {
    key: string;
    label: string;
}

/** `primary` — dark pill (recipes, progress); `accent` — green pill (804:24721). */
export type SegmentedControlTone = 'primary' | 'accent';

export interface SegmentedControlProps {
    items: SegmentedControlItem[];
    activeKey: string;
    onChange: (key: string) => void;
    /** @default 'primary' */
    tone?: SegmentedControlTone;
    /** Splits the track evenly instead of sizing each segment by its label. */
    equalWidths?: boolean;
    style?: StyleProp<ViewStyle>;
}

/** Compact segmented control — RFDS (node 13:9981): grey capsule, dark active segment. */
export const SegmentedControl = ({
    items,
    activeKey,
    onChange,
    style,
    tone = 'primary',
    equalWidths = false,
}: SegmentedControlProps) => {
    return (
        <View style={[styles.track, style]}>
            {items.map(item => {
                const active = item.key === activeKey;
                return (
                    <Pressable
                        key={item.key}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: active }}
                        onPress={() => onChange(item.key)}
                        style={styles.segment(tone, equalWidths, active)}
                    >
                        <AppText variant="buttonSmall" numberOfLines={1} style={styles.label(active)}>
                            {item.label}
                        </AppText>
                    </Pressable>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    track: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
        height: 32,
        padding: 2,
        borderRadius: 100,
        backgroundColor: theme.colors.semantic.lightGrey,
        width: '100%',
    },
    segment: (tone: SegmentedControlTone, equalWidths: boolean, active: boolean) => ({
        // Sized by its label, then given an equal share of what is left over.
        // A flat `flex: 1` divides the track evenly instead, which truncates
        // «Вуглеводи» next to three short labels (670:26757).
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: equalWidths ? 0 : 'auto',
        minWidth: 0,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        // Even halves leave «дюйм» exactly the 8pt padding it needs, and iOS
        // rounds it into an ellipsis — the padding gives way, as in Figma.
        paddingHorizontal: equalWidths ? theme.spacing[1] : theme.spacing[2],
        borderRadius: 20,
        backgroundColor: active
            ? tone === 'accent'
                ? theme.colors.branding.accent
                : theme.colors.branding.primary
            : 'transparent',
    }),
    label: (active: boolean) => ({
        color: active ? theme.colors.semantic.white : theme.colors.semantic.darkGrey,
    }),
}));
