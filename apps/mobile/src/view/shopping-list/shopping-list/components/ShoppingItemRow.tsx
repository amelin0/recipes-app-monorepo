import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppCheckbox, AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';
import type { ShoppingListItem } from '@/state/domains/shopping-list';

export interface ShoppingItemRowProps {
    item: ShoppingListItem;
    onToggle: () => void;
}

/** Shopping list row: round checkbox, name + kcal, amount; checked = muted. */
export const ShoppingItemRow = ({ item, onToggle }: ShoppingItemRowProps) => {
    const { t } = useAppTranslation(['shopping']);
    const name = t(`shopping:products.${item.productKey}`);
    const amountLabel =
        item.unit === 'ml'
            ? t('shopping:list.ml', { value: item.amount.toLocaleString('en-US') })
            : t('shopping:list.grams', { value: item.amount.toLocaleString('en-US') });

    return (
        <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.checked }}
            accessibilityLabel={name}
            onPress={onToggle}
            style={({ pressed }) => styles.row(pressed)}
        >
            <AppCheckbox checked={item.checked} />
            <View style={styles.texts}>
                <AppText variant="bodySmallBold" style={styles.muted(item.checked)}>
                    {name}
                </AppText>
                <AppText variant="bodySmallReg" color="tertiary" style={styles.muted(item.checked)}>
                    {t('shopping:list.kcal', { count: item.kcal })}
                </AppText>
            </View>
            <AppText variant="bodySmallReg" color="tertiary" style={styles.muted(item.checked)}>
                {amountLabel}
            </AppText>
        </Pressable>
    );
};

const styles = StyleSheet.create(theme => ({
    row: (pressed: boolean) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
        paddingHorizontal: theme.spacing[3],
        paddingVertical: theme.spacing[2],
        borderRadius: theme.radius.lg,
        backgroundColor: pressed ? theme.colors.active.tertiary : theme.colors.semantic.lightGrey,
        width: '100%',
    }),
    texts: {
        flex: 1,
        gap: theme.spacing[1],
        paddingVertical: theme.spacing[2],
    },
    muted: (checked: boolean) => ({
        color: checked ? theme.colors.semantic.disabled : undefined,
    }),
}));
