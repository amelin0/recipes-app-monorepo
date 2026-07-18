import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

export interface UserParamsCardProps {
    weight: string;
    height: string;
    activity: string;
    onChangePress: () => void;
}

export const UserParamsCard = ({ weight, height, activity, onChangePress }: UserParamsCardProps) => {
    const { t } = useAppTranslation(['tracking']);

    const params = [
        { label: t('tracking:goal-setup.params-weight'), value: weight },
        { label: t('tracking:goal-setup.params-height'), value: height },
        { label: t('tracking:goal-setup.params-activity'), value: activity, grow: true },
    ];

    return (
        <View style={styles.strip}>
            {params.map(param => (
                <View key={param.label} style={[styles.param, param.grow ? styles.paramGrow : null]}>
                    <AppText variant="bodySmallReg">{param.label}</AppText>
                    <AppText variant="bodySmallBold">{param.value}</AppText>
                </View>
            ))}
            <Pressable accessibilityRole="button" hitSlop={8} onPress={onChangePress}>
                <AppText variant="bodySmallReg" style={styles.change}>
                    {t('tracking:goal-setup.params-change')}
                </AppText>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    strip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[4],
        width: '100%',
        paddingHorizontal: theme.spacing[3],
        paddingVertical: theme.spacing[2],
        borderRadius: 14,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    param: {
        gap: theme.spacing[1],
        justifyContent: 'center',
    },
    paramGrow: {
        flex: 1,
    },
    change: {
        color: theme.colors.branding.accent,
    },
}));
