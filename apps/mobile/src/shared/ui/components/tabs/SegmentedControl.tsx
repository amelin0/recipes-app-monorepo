import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '../texts';

export interface SegmentedControlItem {
    key: string;
    label: string;
}

export interface SegmentedControlProps {
    items: SegmentedControlItem[];
    activeKey: string;
    onChange: (key: string) => void;
    style?: StyleProp<ViewStyle>;
}

/** Compact segmented control — RFDS (node 13:9981): grey capsule, dark active segment. */
export const SegmentedControl = ({ items, activeKey, onChange, style }: SegmentedControlProps) => {
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
                        style={styles.segment(active)}
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
    segment: (active: boolean) => ({
        flex: 1,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing[2],
        borderRadius: 20,
        backgroundColor: active ? theme.colors.branding.primary : 'transparent',
    }),
    label: (active: boolean) => ({
        color: active ? theme.colors.semantic.white : theme.colors.semantic.darkGrey,
    }),
}));
