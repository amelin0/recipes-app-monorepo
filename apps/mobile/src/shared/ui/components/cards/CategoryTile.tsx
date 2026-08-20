import React from 'react';
import { Image, Pressable, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '../texts';

export interface CategoryTileProps {
    image: ImageSourcePropType;
    label: string;
    selected?: boolean;
    onPress: () => void;
    /** Extra styles (rail: fixed min width; grid: flex-1). */
    style?: StyleProp<ViewStyle>;
}

/** Category tile — image 40px + 10px label (selected: light-positive + accent border). */
export const CategoryTile = ({ image, label, selected = false, onPress, style }: CategoryTileProps) => {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
            onPress={onPress}
            style={[styles.tile(selected), style]}
        >
            <Image source={image} style={styles.image} resizeMode="contain" />
            <AppText variant="buttonTab" numberOfLines={1} style={styles.label}>
                {label}
            </AppText>
        </Pressable>
    );
};

const styles = StyleSheet.create(theme => ({
    tile: (selected: boolean) => ({
        height: 72,
        minWidth: 72,
        paddingHorizontal: theme.spacing[2],
        paddingVertical: theme.spacing[1],
        gap: theme.spacing[1],
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.lg,
        backgroundColor: selected ? theme.colors.semantic.lightPositive : theme.colors.semantic.lightGrey,
        borderWidth: selected ? 2 : 0,
        borderColor: selected ? theme.colors.branding.accent : 'transparent',
    }),
    image: {
        width: 40,
        height: 40,
    },
    label: {
        textAlign: 'center',
    },
}));
