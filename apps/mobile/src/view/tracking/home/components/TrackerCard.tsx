import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppCard, AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import ArrowRightIcon from '../../../../../assets/icons/arrow-right.svg';

export interface TrackerCardProps {
    title: string;
    /** Consumed-of-target line, already formatted («240 / 2,000 мл»). */
    value: string;
    /** Opens the tracker's own screen; the chevron appears with it. */
    onPress?: () => void;
    onAdd: () => void;
    /** The bar itself — segmented for water, continuous for steps. */
    children: React.ReactNode;
}

/** Shell shared by the water and steps trackers (435:6144, 805:16313). */
export const TrackerCard = ({ title, value, onPress, onAdd, children }: TrackerCardProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['tracking']);

    return (
        <AppCard>
            <View style={styles.header}>
                <Pressable
                    accessibilityRole={onPress ? 'button' : 'none'}
                    disabled={!onPress}
                    onPress={onPress}
                    style={styles.titleRow}
                >
                    <AppText variant="bodyMediumBold">{title}</AppText>
                    {onPress ? <ArrowRightIcon width={12} height={12} color={theme.colors.elements.primary} /> : null}
                </Pressable>

                <Pressable accessibilityRole="button" hitSlop={8} onPress={onAdd}>
                    <AppText variant="bodySmallReg" style={styles.add}>
                        {t('tracking:home.add')}
                    </AppText>
                </Pressable>
            </View>

            <View style={styles.progress}>
                <AppText variant="bodySmallBold">{value}</AppText>
                {children}
            </View>
        </AppCard>
    );
};

const styles = StyleSheet.create(theme => ({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        width: '100%',
    },
    titleRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
    },
    add: {
        color: theme.colors.branding.accent,
    },
    progress: {
        gap: theme.spacing[1],
        width: '100%',
    },
}));
