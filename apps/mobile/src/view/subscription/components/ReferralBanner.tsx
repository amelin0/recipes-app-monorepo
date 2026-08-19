import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText, TickCircle } from '@/shared/ui/components';

import CloseIcon from '../../../../assets/icons/close.svg';

export interface ReferralBannerProps {
    title: string;
    /** What the code grants, in the accent orange. */
    description: string;
    onRemove: () => void;
    removeLabel: string;
}

/** Confirmation that a referral code is in effect (911:53724). */
export const ReferralBanner = ({ title, description, onRemove, removeLabel }: ReferralBannerProps) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.root}>
            <TickCircle size={36} color={theme.colors.semantic.orange} />

            <View style={styles.labels}>
                <AppText variant="bodyMediumBold">{title}</AppText>
                <AppText variant="bodySmallReg" style={styles.description}>
                    {description}
                </AppText>
            </View>

            <Pressable accessibilityRole="button" accessibilityLabel={removeLabel} hitSlop={8} onPress={onRemove}>
                <CloseIcon width={20} height={20} color={theme.colors.semantic.darkGrey} />
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    root: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
        padding: theme.spacing[3],
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.forms.orangeBorder,
        backgroundColor: theme.colors.semantic.lightOrange,
    },
    labels: {
        flex: 1,
        gap: theme.spacing[1],
    },
    description: {
        color: theme.colors.semantic.orange,
    },
}));
