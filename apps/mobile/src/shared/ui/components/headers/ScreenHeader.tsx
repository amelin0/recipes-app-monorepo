import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '../texts';

export interface ScreenHeaderProps {
    /** Screen title — RFDS `Header` (title/medium). */
    title: string;
    /** Optional supporting copy under the title (body/large, tertiary). */
    subtitle?: string;
}

export const ScreenHeader = ({ title, subtitle }: ScreenHeaderProps) => {
    return (
        <View style={styles.root}>
            <AppText variant="titleMedium">{title}</AppText>
            {subtitle ? (
                <AppText variant="bodyLargeReg" color="tertiary">
                    {subtitle}
                </AppText>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    root: {
        gap: theme.spacing[2],
        width: '100%',
    },
}));
