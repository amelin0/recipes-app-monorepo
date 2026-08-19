import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText, TickCircle } from '@/shared/ui/components';

import CircleOutlineIcon from '../../../../assets/icons/circle-outline.svg';

/** Positive while the plan is picked on price, orange while a referral drives it. */
export type PlanTone = 'positive' | 'orange';

export interface PlanOptionProps {
    /** Plan name — «Рік» / «Місяць». */
    title: string;
    /** Struck-through undiscounted price, when the plan is discounted. */
    listPrice?: string;
    /** Discounted period price, shown next to the struck one. */
    price?: string;
    /** Period the price covers — «на рік». */
    period?: string;
    /** Replaces the price line when there is nothing to compare against. */
    caption?: string;
    /** Right-hand headline price — the per-month figure, or «Безкоштовно». */
    trailing: string;
    selected: boolean;
    /** @default 'positive' */
    tone?: PlanTone;
    onPress: () => void;
    accessibilityLabel?: string;
}

/** One row of the plan picker (911:52892 / 911:52901). */
export const PlanOption = ({
    title,
    listPrice,
    price,
    period,
    caption,
    trailing,
    selected,
    tone = 'positive',
    onPress,
    accessibilityLabel,
}: PlanOptionProps) => {
    const { theme } = useUnistyles();
    const accent = tone === 'orange' ? theme.colors.semantic.orange : theme.colors.semantic.positive;

    return (
        <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={accessibilityLabel}
            onPress={onPress}
            style={styles.wrapper}
        >
            {/* RFDS shadow/positive is a 0-blur drop shadow with an 8px spread;
                RN has no spread, so the halo is a concentric view behind the row. */}
            {selected ? <View style={styles.ring(tone)} /> : null}

            <View style={styles.card(selected, accent)}>
                <View style={styles.labels}>
                    <AppText variant="titleSmall">{title}</AppText>
                    {price ? (
                        <View style={styles.priceRow}>
                            {listPrice ? (
                                <AppText variant="bodySmallReg" style={[styles.muted, styles.struck]}>
                                    {listPrice}
                                </AppText>
                            ) : null}
                            <AppText variant="bodySmallBold">{price}</AppText>
                            {period ? (
                                <AppText variant="bodySmallReg" style={styles.muted}>
                                    {period}
                                </AppText>
                            ) : null}
                        </View>
                    ) : null}
                    {caption ? (
                        <AppText variant="bodySmallReg" style={styles.muted}>
                            {caption}
                        </AppText>
                    ) : null}
                </View>

                <AppText variant="bodyLargeBold">{trailing}</AppText>

                {selected ? (
                    <TickCircle size={24} color={accent} />
                ) : (
                    <CircleOutlineIcon width={24} height={24} color={theme.colors.forms.lightBorder} />
                )}
            </View>
        </Pressable>
    );
};

const RING_SPREAD = 8;

const styles = StyleSheet.create(theme => ({
    wrapper: {
        width: '100%',
    },
    ring: (tone: PlanTone) => ({
        position: 'absolute',
        top: -RING_SPREAD,
        left: -RING_SPREAD,
        right: -RING_SPREAD,
        bottom: -RING_SPREAD,
        borderRadius: theme.radius.lg + RING_SPREAD,
        backgroundColor: tone === 'orange' ? theme.colors.semantic.orangeRing : theme.colors.semantic.positiveRing,
        zIndex: -1,
    }),
    card: (selected: boolean, accent: string) => ({
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        paddingHorizontal: theme.spacing[3],
        paddingVertical: theme.spacing[4],
        borderRadius: theme.radius.lg,
        borderWidth: 2,
        borderColor: selected ? accent : theme.colors.forms.lightBorder,
        backgroundColor: theme.colors.semantic.white,
        overflow: 'hidden',
    }),
    labels: {
        flex: 1,
        justifyContent: 'center',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: theme.spacing[1],
    },
    struck: {
        textDecorationLine: 'line-through',
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
}));
