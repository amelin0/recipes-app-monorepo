import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

export interface TipCardProps {
    /** Highlighted prefix (💡 Порада:). */
    label: string;
    text: string;
}

/** Accent-tinted tip box (Figma 435:12792). */
export const TipCard = ({ label, text }: TipCardProps) => {
    return (
        <View style={styles.box}>
            <AppText variant="bodySmallReg">
                <AppText variant="bodySmallReg" style={styles.label}>
                    {label}
                </AppText>
                {text}
            </AppText>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    box: {
        width: '100%',
        padding: theme.spacing[4],
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.branding.accent,
        backgroundColor: theme.colors.branding.accentSubtle,
    },
    label: {
        color: theme.colors.branding.accent,
    },
}));
