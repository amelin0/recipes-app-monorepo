import React from 'react';
import { View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppCard, AppText, MacroBadge, macroPalette, type MacroKey } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

export interface MacroBalanceSegment {
    key: MacroKey;
    /** Share 0..1 of the macro calories. */
    share: number;
}

export interface MacroBalanceCardProps {
    segments: MacroBalanceSegment[];
}

/**
 * How the calorie goal splits across the macros (811:53503). Each macro owns a
 * column as wide as its share, so the bar's rounded ends belong to the outer
 * two and the badge sits above its own segment.
 */
export const MacroBalanceCard = ({ segments }: MacroBalanceCardProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['tracking']);
    const palette = macroPalette(theme.colors);

    return (
        <AppCard style={styles.card}>
            <AppText variant="bodyLargeBold" style={styles.title}>
                {t('tracking:goal-setup.balance-title')}
            </AppText>

            <View style={styles.row}>
                {segments.map((segment, index) => (
                    <View key={segment.key} style={styles.column(segment.share)}>
                        <View
                            style={[
                                styles.bar(index === 0, index === segments.length - 1),
                                { backgroundColor: palette[segment.key].color },
                            ]}
                        />
                        <View style={styles.legend}>
                            <MacroBadge
                                letter={t(`tracking:home.macros.${segment.key}`)}
                                color={palette[segment.key].color}
                                backgroundColor={palette[segment.key].backgroundColor}
                            />
                            <AppText variant="bodySmallReg">
                                {t('tracking:goal-setup.percent', {
                                    value: (segment.share * 100).toFixed(1).replace('.', ','),
                                })}
                            </AppText>
                        </View>
                    </View>
                ))}
            </View>
        </AppCard>
    );
};

const styles = StyleSheet.create(theme => ({
    card: {
        alignItems: 'flex-start',
        gap: theme.spacing[2],
    },
    title: {
        width: '100%',
    },
    row: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    column: (share: number) => ({
        flexGrow: share,
        flexBasis: 0,
        // The legend may overflow a very thin column rather than stretch it.
        minWidth: 0,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[1],
    }),
    bar: (first: boolean, last: boolean) => ({
        width: '100%',
        height: 8,
        borderTopLeftRadius: first ? theme.radius.full : 0,
        borderBottomLeftRadius: first ? theme.radius.full : 0,
        borderTopRightRadius: last ? theme.radius.full : 0,
        borderBottomRightRadius: last ? theme.radius.full : 0,
    }),
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
    },
}));
