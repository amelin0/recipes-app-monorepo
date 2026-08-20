import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

export interface ReferralStatBoxProps {
    label: string;
    /** Already formatted number. */
    value: string;
    caption: string;
}

/** «Приєдналось 2 користувача» — one of the pair of tallies (804:24654). */
export const ReferralStatBox = ({ label, value, caption }: ReferralStatBoxProps) => (
    <View style={styles.box}>
        <AppText variant="bodySmallReg">{label}</AppText>
        <View style={styles.figure}>
            <AppText variant="titleSmall">{value}</AppText>
            <AppText variant="bodySmallReg" style={styles.caption}>
                {caption}
            </AppText>
        </View>
    </View>
);

const styles = StyleSheet.create(theme => ({
    box: {
        flex: 1,
        minWidth: 0,
        alignItems: 'center',
        gap: theme.spacing[1],
        padding: theme.spacing[2],
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    figure: {
        alignItems: 'center',
        gap: theme.spacing[1],
    },
    caption: {
        color: theme.colors.semantic.darkGrey,
    },
}));
