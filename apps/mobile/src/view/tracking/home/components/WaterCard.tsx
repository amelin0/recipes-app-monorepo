import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppCard, AppText, SegmentedProgressBar } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

export interface WaterCardProps {
    /** Consumed volume, ml. */
    current: number;
    /** Daily target, ml. */
    target: number;
    /** Number of bar segments. @default 10 */
    segments?: number;
    onAdd: () => void;
}

const formatNumber = (value: number) => value.toLocaleString('en-US');

export const WaterCard = ({ current, target, segments = 10, onAdd }: WaterCardProps) => {
    const { t } = useAppTranslation(['tracking']);
    const filled = target > 0 ? Math.round((current / target) * segments) : 0;

    return (
        <AppCard>
            <View style={styles.header}>
                <AppText variant="bodyMediumBold" style={styles.title}>
                    {t('tracking:home.water')}
                </AppText>
                <Pressable accessibilityRole="button" hitSlop={8} onPress={onAdd}>
                    <AppText variant="bodySmallReg" style={styles.add}>
                        {t('tracking:home.add')}
                    </AppText>
                </Pressable>
            </View>

            <View style={styles.progress}>
                <AppText variant="bodySmallBold">
                    {t('tracking:home.water-progress', {
                        current: formatNumber(current),
                        max: formatNumber(target),
                    })}
                </AppText>
                <SegmentedProgressBar segments={segments} filled={filled} />
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
    title: {
        flex: 1,
    },
    add: {
        color: theme.colors.branding.accent,
    },
    progress: {
        gap: theme.spacing[1],
        width: '100%',
    },
}));
