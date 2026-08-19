import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

export interface MacroBadgeProps {
    /** Single-letter macro label (Б / Ж / В). */
    letter: string;
    color: string;
    backgroundColor: string;
}

/** 20px tinted pill holding one macro letter (476:13411, 435:6033). */
export const MacroBadge = ({ letter, color, backgroundColor }: MacroBadgeProps) => (
    <View style={[styles.badge, { backgroundColor }]}>
        <AppText variant="bodySmallReg" style={{ color }}>
            {letter}
        </AppText>
    </View>
);

const styles = StyleSheet.create(theme => ({
    badge: {
        width: 20,
        height: 20,
        paddingHorizontal: theme.spacing[1],
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
}));
