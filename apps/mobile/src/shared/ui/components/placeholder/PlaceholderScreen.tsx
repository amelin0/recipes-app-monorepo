import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppScreen } from '../layouts';
import { AppText } from '../texts';

export interface PlaceholderScreenProps {
    title: string;
}

/**
 * Temporary route stub. Real screens live in `src/view/<domain>/<screen>/`
 * and are added one by one from Figma designs — replace the stub import
 * in the route file when the screen ships.
 */
export const PlaceholderScreen = ({ title }: PlaceholderScreenProps) => {
    return (
        <AppScreen>
            <View style={styles.content}>
                <AppText variant="titleLarge">{title}</AppText>
                <AppText color="tertiary">Екран буде додано з Figma-макета.</AppText>
            </View>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[4],
        gap: theme.spacing[2],
    },
}));
