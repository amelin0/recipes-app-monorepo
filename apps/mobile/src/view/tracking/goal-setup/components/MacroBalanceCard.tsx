import React from 'react';
import { View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppCard, AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

export interface MacroBalanceSegment {
    key: string;
    /** Legend badge label (Б / Ж / В / ккал). */
    label: string;
    /** Share 0..1 of total calories. */
    share: number;
    /** Segment / badge accent color. */
    color: string;
    /** Legend badge background; solid `color` with white text when omitted. */
    badgeBg?: string;
}

export interface MacroBalanceCardProps {
    segments: MacroBalanceSegment[];
}

/** Stacked macro-calorie balance bar with a legend (Figma 435:12707). */
export const MacroBalanceCard = ({ segments }: MacroBalanceCardProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['tracking']);
    const visible = segments.filter(segment => segment.share > 0);

    return (
        <AppCard style={styles.card}>
            <AppText variant="bodyLargeBold" style={styles.title}>
                {t('tracking:goal-setup.balance-title')}
            </AppText>

            <View style={styles.bar}>
                {visible.map(segment => (
                    <View
                        key={segment.key}
                        style={[styles.segment(segment.share), { backgroundColor: segment.color }]}
                    />
                ))}
            </View>

            <View style={styles.legend}>
                {segments.map(segment => (
                    <View key={segment.key} style={styles.legendItem}>
                        <View style={[styles.badge, { backgroundColor: segment.badgeBg ?? segment.color }]}>
                            <AppText
                                variant="bodySmallReg"
                                style={{ color: segment.badgeBg ? segment.color : theme.colors.semantic.white }}
                            >
                                {segment.label}
                            </AppText>
                        </View>
                        <AppText variant="bodySmallReg">{Math.round(segment.share * 100)}%</AppText>
                    </View>
                ))}
            </View>
        </AppCard>
    );
};

const styles = StyleSheet.create(theme => ({
    card: {
        alignItems: 'flex-start',
    },
    title: {
        width: '100%',
    },
    bar: {
        flexDirection: 'row',
        width: '100%',
        borderRadius: theme.radius.full,
        overflow: 'hidden',
    },
    segment: (share: number) => ({
        flexGrow: share,
        flexBasis: 0,
        minWidth: 1,
        height: 8,
    }),
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        flexWrap: 'wrap',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
    },
    badge: {
        minWidth: 20,
        height: 20,
        paddingHorizontal: theme.spacing[1],
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
}));
