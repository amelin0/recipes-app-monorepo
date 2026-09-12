import React, { useRef } from 'react';
import { Pressable, View } from 'react-native';

import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import type { ShoppingItem } from '@/data';
import { AppCheckbox, AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import TrashIcon from '../../../../../assets/icons/trash.svg';

/** Width the swipe reveals — the same one the dish rows use. */
const ACTION_WIDTH = 52;

export interface ShoppingItemRowProps {
    item: ShoppingItem;
    onToggle: () => void;
    /**
     * Прибрати рядок. Дається лише доданим руками: рядок з плану свого рядка
     * не має, і сервер відповів би на нього 404.
     */
    onRemove?: () => void;
}

/** Shopping list row: round checkbox, name, amount; checked = muted (435:16318). */
export const ShoppingItemRow = ({ item, onToggle, onRemove }: ShoppingItemRowProps) => {
    const { t } = useAppTranslation(['shopping']);
    const { theme } = useUnistyles();
    const swipeable = useRef<SwipeableMethods>(null);
    const name = item.name;
    // Грами — єдина одиниця, яку несе відповідь: обʼєм чекає, поки продукти
    // почнуть його вказувати (weekly-list FR-002).
    const amountLabel = t('shopping:list.grams', { value: Math.round(item.amountG).toLocaleString('en-US') });

    const row = (
        <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.purchased }}
            accessibilityLabel={name}
            onPress={onToggle}
            style={({ pressed }) => styles.row(pressed)}
        >
            <AppCheckbox checked={item.purchased} />
            <View style={styles.texts}>
                <AppText variant="bodySmallBold" style={styles.muted(item.purchased)}>
                    {name}
                </AppText>
            </View>
            <AppText variant="bodySmallReg" color="tertiary" style={styles.muted(item.purchased)}>
                {amountLabel}
            </AppText>
        </Pressable>
    );

    // Обгортка стоїть і без дії: без неї горизонтальне протягування по рядку
    // з плану доїжджало до Pressable і відмічало продукт купленим.
    return (
        <ReanimatedSwipeable
            ref={swipeable}
            // Ширину треба назвати обом контейнерам: Swipeable лишає їх за
            // вмістом, і рядок усередині міряється саме по них.
            containerStyle={styles.swipeContainer}
            childrenContainerStyle={styles.swipeContainer}
            friction={2}
            rightThreshold={ACTION_WIDTH / 2}
            overshootRight={false}
            renderRightActions={
                onRemove
                    ? () => (
                          <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={t('shopping:list.remove-a11y', { name })}
                              onPress={() => {
                                  swipeable.current?.close();
                                  onRemove();
                              }}
                              style={styles.swipeAction}
                          >
                              <View style={styles.deleteButton}>
                                  <TrashIcon width={20} height={20} color={theme.colors.semantic.white} />
                              </View>
                          </Pressable>
                      )
                    : undefined
            }
        >
            {row}
        </ReanimatedSwipeable>
    );
};

const styles = StyleSheet.create(theme => ({
    row: (pressed: boolean) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
        paddingHorizontal: theme.spacing[3],
        // Однорядковий рядок (435:16318): висоту тримає minHeight, тож довга
        // назва в два рядки переростає її, а коротка не стискає рядок.
        paddingVertical: theme.spacing[2],
        minHeight: 44,
        borderRadius: theme.radius.lg,
        backgroundColor: pressed ? theme.colors.active.tertiary : theme.colors.semantic.lightGrey,
        width: '100%',
    }),
    texts: {
        flex: 1,
    },
    muted: (checked: boolean) => ({
        color: checked ? theme.colors.semantic.disabled : undefined,
    }),
    swipeContainer: {
        width: '100%',
    },
    swipeAction: {
        width: ACTION_WIDTH,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    deleteButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.negative,
    },
}));
