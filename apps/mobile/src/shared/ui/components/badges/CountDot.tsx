import React from 'react';
import { View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '../texts';

export interface CountDotProps {
    /** Number shown inside the dot. */
    count: number;
    /** Extra styles merged onto the dot (e.g. absolute positioning). */
    style?: StyleProp<ViewStyle>;
}

/** Red notification dot with a count — RFDS `dot` (type=number, color=red). */
export const CountDot = ({ count, style }: CountDotProps) => {
    return (
        <View style={[styles.dot, style]}>
            <AppText style={styles.count as StyleProp<TextStyle>} numberOfLines={1}>
                {count > 99 ? '99+' : count}
            </AppText>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    dot: {
        minWidth: 12,
        height: 12,
        paddingHorizontal: 2,
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: theme.colors.semantic.white,
        backgroundColor: theme.colors.semantic.negative,
        alignItems: 'center',
        justifyContent: 'center',
    },
    count: {
        fontFamily: theme.typography.buttonTab.fontFamily,
        fontSize: 7,
        lineHeight: 9,
        color: theme.colors.semantic.white,
    },
}));
