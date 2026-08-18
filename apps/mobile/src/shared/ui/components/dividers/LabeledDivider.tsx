import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '../texts';

export interface LabeledDividerProps {
    /** Copy rendered between the two hairlines (e.g. "або"). */
    label: string;
}

/** Horizontal hairline pair with a centered label — the "або" separator from the auth screens. */
export const LabeledDivider = ({ label }: LabeledDividerProps) => {
    return (
        <View style={styles.row}>
            <View style={styles.line} />
            <AppText variant="bodyMediumReg" color="tertiary">
                {label}
            </AppText>
            <View style={styles.line} />
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[4],
        width: '100%',
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: theme.colors.forms.divider,
    },
}));
