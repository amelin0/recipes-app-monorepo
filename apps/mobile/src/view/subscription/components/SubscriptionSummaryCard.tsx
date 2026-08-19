import React from 'react';
import { View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText, ProgressBar } from '@/shared/ui/components';

export interface SubscriptionSummaryCardProps {
    /** «План підписки». */
    label: string;
    /** Billing period name — «Місяць» / «Рік». */
    planName: string;
    /** Headline price, or «Безкоштовно» while a referral covers it. */
    price: string;
    /** Undiscounted price line — only rendered when the plan is discounted. */
    fullPrice?: { label: string; value: string };
    /** Shown when the subscription came from a referral code. */
    tag?: string;
    startLabel: string;
    startValue: string;
    endLabel: string;
    endValue: string;
    remainingLabel: string;
    remainingValue: string;
    /** Share of the period still to run, 0..1. */
    remainingProgress: number;
}

/** What the user just bought — the success screen's top card (911:52521). */
export const SubscriptionSummaryCard = ({
    label,
    planName,
    price,
    fullPrice,
    tag,
    startLabel,
    startValue,
    endLabel,
    endValue,
    remainingLabel,
    remainingValue,
    remainingProgress,
}: SubscriptionSummaryCardProps) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.root}>
            <View style={styles.headerRow}>
                <View style={styles.plan}>
                    <View style={styles.emojiBox}>
                        <AppText variant="titleSmall">⭐</AppText>
                    </View>
                    <View>
                        <AppText variant="bodyMediumBold">{label}</AppText>
                        <AppText variant="bodySmallReg" style={styles.muted}>
                            {planName}
                        </AppText>
                    </View>
                </View>

                <View style={styles.priceColumn}>
                    {tag ? (
                        <View style={styles.tag}>
                            <AppText variant="bodySmallBold" style={styles.tagLabel}>
                                {tag}
                            </AppText>
                        </View>
                    ) : null}
                    <AppText variant="bodyLargeBold" style={styles.price}>
                        {price}
                    </AppText>
                </View>
            </View>

            {fullPrice ? (
                <View style={styles.fullPriceRow}>
                    <AppText variant="bodySmallReg" style={styles.muted}>
                        {fullPrice.label}
                    </AppText>
                    <AppText variant="bodySmallReg" style={styles.muted}>
                        {fullPrice.value}
                    </AppText>
                </View>
            ) : null}

            <View style={styles.datesRow}>
                <View style={styles.dateBox}>
                    <AppText variant="bodySmallReg" style={styles.muted}>
                        {startLabel}
                    </AppText>
                    <AppText variant="bodyMediumBold">{startValue}</AppText>
                </View>
                <View style={styles.dateBox}>
                    <AppText variant="bodySmallReg" style={styles.muted}>
                        {endLabel}
                    </AppText>
                    <AppText variant="bodyMediumBold">{endValue}</AppText>
                </View>
            </View>

            <View style={styles.remaining}>
                <View style={styles.remainingRow}>
                    <AppText variant="bodySmallReg" style={styles.muted}>
                        {remainingLabel}
                    </AppText>
                    <AppText variant="bodyMediumBold" style={styles.price}>
                        {remainingValue}
                    </AppText>
                </View>
                <ProgressBar progress={remainingProgress} color={theme.colors.branding.accent} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    root: {
        width: '100%',
        gap: theme.spacing[3],
        // Same centered 1px stroke as the paywall's plans card — the padding
        // absorbs it so the content box keeps its designed 311 width.
        padding: theme.spacing[4] - 1,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.forms.softOrangeBorder,
        backgroundColor: theme.colors.semantic.white,
        ...theme.shadow.block,
    },
    headerRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    plan: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
    },
    emojiBox: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    priceColumn: {
        alignItems: 'flex-end',
    },
    tag: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing[2],
        paddingVertical: 2,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.lightOrange,
    },
    tagLabel: {
        color: theme.colors.semantic.orange,
    },
    fullPriceRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[1],
    },
    datesRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
    },
    dateBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing[3],
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    remaining: {
        width: '100%',
        gap: theme.spacing[1],
    },
    remainingRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
    price: {
        color: theme.colors.branding.accent,
    },
}));
