import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

export interface EmptyMetricNoteProps {
    label: string;
}

/**
 * Стоїть замість графіка, поки вимірів немає.
 *
 * Порожня сітка з підписами 4/3/2/1 і «0 см» у чипах виглядали як справжні
 * дані: людина читала це як «зріст нуль», а не як «ще нічого не записано».
 */
export const EmptyMetricNote = ({ label }: EmptyMetricNoteProps) => (
    <View style={styles.box}>
        <AppText variant="bodyMediumReg" style={styles.label}>
            {label}
        </AppText>
    </View>
);

const styles = StyleSheet.create(theme => ({
    box: {
        // Той самий зріст, що й у лінійного графіка, щоб картка не стрибала.
        width: '100%',
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        color: theme.colors.semantic.darkGrey,
        textAlign: 'center',
    },
}));
