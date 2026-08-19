import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

export interface ErrorBannerProps {
    message: string;
}

/** Tinted validation message under a field (804:25482). */
export const ErrorBanner = ({ message }: ErrorBannerProps) => (
    <View style={styles.banner}>
        <AppText variant="bodySmallReg" style={styles.message}>
            {message}
        </AppText>
    </View>
);

const styles = StyleSheet.create(theme => ({
    banner: {
        width: '100%',
        paddingHorizontal: theme.spacing[3],
        paddingVertical: theme.spacing[2],
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.semantic.lightNegative,
    },
    message: {
        color: theme.colors.semantic.negative,
    },
}));
