import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

import ArrowRightIcon from '../../../../assets/icons/arrow-right.svg';

export interface MetricCardProps {
    title: string;
    /** One-line explanation of what the metric is for. */
    subtitle: string;
    /** Opens the metric's own screen; the chevron appears with it. */
    onPress?: () => void;
    children: React.ReactNode;
}

/** One tracked metric on the progress screen (670:26711). */
export const MetricCard = ({ title, subtitle, onPress, children }: MetricCardProps) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.card}>
            <Pressable
                accessibilityRole={onPress ? 'button' : 'none'}
                disabled={!onPress}
                onPress={onPress}
                style={styles.header}
            >
                <View style={styles.titleRow}>
                    <AppText variant="bodyLargeBold">{title}</AppText>
                    {onPress ? <ArrowRightIcon width={16} height={16} color={theme.colors.elements.primary} /> : null}
                </View>
                <AppText variant="bodySmallReg" style={styles.subtitle}>
                    {subtitle}
                </AppText>
            </Pressable>

            {children}
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    card: {
        width: '100%',
        alignItems: 'center',
        gap: theme.spacing[4],
        padding: theme.spacing[4],
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.semantic.white,
        overflow: 'hidden',
        ...theme.shadow.block,
    },
    header: {
        width: '100%',
        gap: theme.spacing[1],
        justifyContent: 'center',
    },
    titleRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    subtitle: {
        width: '100%',
        color: theme.colors.semantic.darkGrey,
    },
}));
