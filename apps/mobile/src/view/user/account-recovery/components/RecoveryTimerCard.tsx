import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppCard, AppText } from '@/shared/ui/components';

export interface RecoveryTimerCardProps {
    caption: string;
    /** Already formatted, e.g. «30 днів 14:32:07». */
    countdown: string;
}

/** How long is left to change your mind (804:25377). */
export const RecoveryTimerCard = ({ caption, countdown }: RecoveryTimerCardProps) => (
    <AppCard style={styles.card}>
        <AppText variant="bodySmallReg" style={styles.caption}>
            {caption}
        </AppText>
        <View style={styles.badge}>
            <AppText variant="titleSmall" style={styles.countdown}>
                {countdown}
            </AppText>
        </View>
    </AppCard>
);

const styles = StyleSheet.create(theme => ({
    card: {
        gap: theme.spacing[4],
    },
    caption: {
        width: '100%',
        textAlign: 'center',
        color: theme.colors.semantic.darkGrey,
    },
    badge: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing[4],
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    countdown: {
        color: theme.colors.semantic.positive,
    },
}));
