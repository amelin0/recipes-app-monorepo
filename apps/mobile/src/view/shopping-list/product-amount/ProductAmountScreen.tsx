import React from 'react';
import { View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton, AppText, CircleIconButton, SegmentedTabs } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { AMOUNT_UNIT_KEYS } from '../shopping.constants';

import { AmountStepper } from './components';
import { useProductAmountScreen } from './useProductAmountScreen';

export const ProductAmountScreen = () => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['shopping', 'common']);
    const {
        title,
        unit,
        handleUnitChange,
        valueText,
        setValueText,
        suffix,
        hint,
        handleDecrease,
        handleIncrease,
        handleAdd,
        handleClose,
    } = useProductAmountScreen();

    return (
        <View style={styles.sheet}>
            <View style={styles.headerBar}>
                <AppText variant="titleMedium" style={styles.headerTitle}>
                    {title}
                </AppText>
                <CircleIconButton accessibilityLabel={t('common:actions.close')} onPress={handleClose}>
                    <Ionicons name="close" size={24} color={theme.colors.elements.primary} />
                </CircleIconButton>
            </View>

            <View style={styles.content}>
                <SegmentedTabs
                    items={AMOUNT_UNIT_KEYS.map(key => ({ key, label: t(`shopping:amount.units.${key}`) }))}
                    activeKey={unit}
                    onChange={handleUnitChange}
                />
                <AmountStepper
                    valueText={valueText}
                    onChangeValueText={setValueText}
                    suffix={suffix}
                    hint={hint}
                    onDecrease={handleDecrease}
                    onIncrease={handleIncrease}
                />
            </View>

            <View style={styles.footer}>
                <AppButton size="md" fullWidth label={t('shopping:amount.add')} onPress={handleAdd} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    sheet: {
        flex: 1,
        backgroundColor: theme.colors.semantic.white,
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[6],
        paddingBottom: theme.spacing[4],
    },
    headerTitle: {
        flex: 1,
    },
    content: {
        gap: theme.spacing[4],
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[6],
    },
    footer: {
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[6],
    },
}));
