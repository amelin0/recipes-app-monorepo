import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppCard, AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import ArrowRightIcon from '../../../../../assets/icons/arrow-right.svg';

export interface MealCardProps {
    title: string;
    /** Planned time (hidden when absent — e.g. Перекус). */
    time?: string;
    /** Show the chevron next to the title (opens meal details). */
    onPress?: () => void;
    onAdd: () => void;
}

export const MealCard = ({ title, time, onPress, onAdd }: MealCardProps) => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['tracking']);

    return (
        <AppCard>
            <View style={styles.header}>
                <Pressable accessibilityRole={onPress ? 'button' : 'none'} disabled={!onPress} onPress={onPress}>
                    <View style={styles.titleRow}>
                        <AppText variant="bodyMediumBold">{title}</AppText>
                        {onPress ? (
                            <ArrowRightIcon width={12} height={12} color={theme.colors.elements.primary} />
                        ) : null}
                    </View>
                    {time ? (
                        <AppText variant="bodyMediumReg" style={styles.muted}>
                            {time}
                        </AppText>
                    ) : null}
                </Pressable>

                <Pressable accessibilityRole="button" hitSlop={8} onPress={onAdd}>
                    <AppText variant="bodySmallReg" style={styles.add}>
                        {t('tracking:home.add')}
                    </AppText>
                </Pressable>
            </View>

            <AppText variant="bodySmallReg" style={styles.muted}>
                {t('tracking:home.not-planned')}
            </AppText>
        </AppCard>
    );
};

const styles = StyleSheet.create(theme => ({
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        width: '100%',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
    },
    muted: {
        color: theme.colors.active.secondary,
    },
    add: {
        color: theme.colors.branding.accent,
    },
}));
