import React from 'react';
import { ScrollView, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton, AppScreen, AppText, CircleIconButton } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import AddIcon from '../../../../assets/icons/add.svg';
import AddSquareIcon from '../../../../assets/icons/add-square.svg';

import { AddFromPlanCard, ShoppingItemRow } from './components';
import { useShoppingListScreen } from './useShoppingListScreen';

export const ShoppingListScreen = () => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['shopping']);
    const { groups, isEmpty, addFromPlan, switchAddFromPlan, toggleShoppingItem, handleAddProduct } =
        useShoppingListScreen();

    return (
        <AppScreen>
            <View style={styles.headerBar}>
                <AppText variant="titleMedium" style={styles.headerTitle}>
                    {t('shopping:list.title')}
                </AppText>
                <CircleIconButton accessibilityLabel={t('shopping:list.add-a11y')} onPress={handleAddProduct}>
                    <AddIcon width={24} height={24} color={theme.colors.elements.primary} />
                </CircleIconButton>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <AddFromPlanCard value={addFromPlan} onValueChange={switchAddFromPlan} />

                {isEmpty ? (
                    <View style={styles.empty}>
                        <AppText variant="bodySmallReg" color="tertiary" style={styles.emptyText}>
                            {t('shopping:list.empty')}
                        </AppText>
                        <AppButton
                            variant="secondary"
                            size="md"
                            fullWidth
                            label={t('shopping:list.add-product')}
                            leftSlot={<AddSquareIcon width={24} height={24} color={theme.colors.elements.primary} />}
                            onPress={handleAddProduct}
                        />
                    </View>
                ) : (
                    groups.map(group => (
                        <View key={group.categoryKey} style={styles.groupCard}>
                            <AppText variant="bodyMediumBold">{t(`shopping:categories.${group.categoryKey}`)}</AppText>
                            {group.items.map(item => (
                                <ShoppingItemRow
                                    key={item.id}
                                    item={item}
                                    onToggle={() => toggleShoppingItem(item.id)}
                                />
                            ))}
                        </View>
                    ))
                )}
            </ScrollView>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        minHeight: 72,
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[2],
    },
    headerTitle: {
        flex: 1,
    },
    scroll: {
        paddingHorizontal: theme.spacing[4],
        paddingBottom: 120,
        gap: theme.spacing[4],
    },
    empty: {
        alignItems: 'center',
        gap: theme.spacing[4],
        paddingVertical: theme.spacing[6],
        width: '100%',
    },
    emptyText: {
        textAlign: 'center',
    },
    groupCard: {
        gap: theme.spacing[2],
        padding: theme.spacing[4],
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.semantic.white,
        width: '100%',
        ...theme.shadow.block,
    },
}));
