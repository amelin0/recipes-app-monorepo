import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppSwitch, AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

export interface AddFromPlanCardProps {
    value: boolean;
    onValueChange: (value: boolean) => void;
}

/** «Додати з плану» switch card at the top of the shopping list. */
export const AddFromPlanCard = ({ value, onValueChange }: AddFromPlanCardProps) => {
    const { t } = useAppTranslation(['shopping']);

    return (
        <View style={styles.card}>
            <View style={styles.texts}>
                <AppText variant="bodyLargeBold">{t('shopping:list.from-plan-title')}</AppText>
                <AppText variant="bodySmallReg" color="tertiary">
                    {t('shopping:list.from-plan-subtitle')}
                </AppText>
            </View>
            <AppSwitch
                value={value}
                onValueChange={onValueChange}
                accessibilityLabel={t('shopping:list.from-plan-a11y')}
            />
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
        paddingHorizontal: theme.spacing[5],
        paddingVertical: theme.spacing[3],
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.forms.lightBorder,
        backgroundColor: theme.colors.semantic.lightGrey,
        width: '100%',
    },
    texts: {
        flex: 1,
        gap: theme.spacing[1],
    },
}));
