import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

export interface DangerBadgeProps {
    /** 32px icon node, drawn white on the negative disc. */
    children: React.ReactNode;
}

/** 100pt halo + 70pt negative disc that opens both deletion steps (804:24926). */
export const DangerBadge = ({ children }: DangerBadgeProps) => (
    <View style={styles.halo}>
        <View style={styles.disc}>{children}</View>
    </View>
);

const styles = StyleSheet.create(theme => ({
    halo: {
        width: 100,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.lightNegative,
    },
    disc: {
        width: 70,
        height: 70,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.negative,
    },
}));
