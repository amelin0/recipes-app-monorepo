import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '../texts';

export interface SegmentedTabItem {
    key: string;
    label: string;
}

export interface SegmentedTabsProps {
    items: SegmentedTabItem[];
    activeKey: string;
    onChange: (key: string) => void;
    /** Sizes each tab by its label instead of splitting the row evenly. */
    contentSized?: boolean;
    /** Extra styles merged onto the row. */
    style?: StyleProp<ViewStyle>;
}

/** Row of pill tabs — RFDS `tab` (active = Branding/primary fill, white label). */
export const SegmentedTabs = ({ items, activeKey, onChange, contentSized = false, style }: SegmentedTabsProps) => {
    return (
        <View style={[styles.row, style]}>
            {items.map(item => {
                const active = item.key === activeKey;
                return (
                    <Pressable
                        key={item.key}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: active }}
                        onPress={() => onChange(item.key)}
                        style={styles.tab(active, contentSized)}
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
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        width: '100%',
    },
    tab: (active: boolean, contentSized: boolean) => ({
        flex: contentSized ? undefined : 1,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing[4],
        borderRadius: theme.radius.full,
        backgroundColor: active ? theme.colors.branding.primary : theme.colors.semantic.lightGrey,
    }),
    label: (active: boolean) => ({
        color: active ? theme.colors.semantic.white : theme.colors.elements.primary,
    }),
}));
