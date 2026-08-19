import React from 'react';
import { View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

import StarIcon from '../../../../assets/icons/star-filled.svg';

export interface SocialProofProps {
    rating: string;
    /** Install count line shown next to the rating. */
    users: string;
    quote: string;
    author: string;
}

/** Rating pill over a customer quote — the paywall's proof block (911:52877). */
export const SocialProof = ({ rating, users, quote, author }: SocialProofProps) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.root}>
            <View style={styles.pill}>
                <StarIcon width={16} height={16} color={theme.colors.semantic.gold} />
                <AppText variant="bodyMediumBold" style={styles.centered}>
                    {rating}
                </AppText>
                <AppText style={[styles.centered, styles.muted]}>{users}</AppText>
            </View>

            <View style={styles.quoteBlock}>
                <AppText style={styles.centered}>{quote}</AppText>
                <AppText style={[styles.centered, styles.muted]}>{author}</AppText>
            </View>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    root: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[3],
        padding: theme.spacing[3],
        // 18 sits between radius.lg and radius.xl — the design nudges this one
        // box off the scale (911:52877) so the inner pill keeps its margin.
        borderRadius: 18,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[2],
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[2],
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: theme.colors.forms.lightBorder,
        backgroundColor: theme.colors.semantic.white,
        ...theme.shadow.block,
    },
    quoteBlock: {
        width: '100%',
        alignItems: 'center',
        gap: theme.spacing[1],
    },
    centered: {
        textAlign: 'center',
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
}));
