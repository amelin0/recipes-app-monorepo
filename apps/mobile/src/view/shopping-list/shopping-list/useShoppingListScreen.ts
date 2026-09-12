import { useCallback } from 'react';

import { router } from 'expo-router';

import type { ShoppingItem } from '@/data';
import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';
import {
    useGetShoppingList,
    useRemoveShoppingItem,
    useTogglePlanImport,
    useTogglePurchased,
} from '@/state/domains/shopping-list';

export const useShoppingListScreen = () => {
    const { t } = useAppTranslation(['shopping', 'common']);

    const from = useStore(state => state.shoppingFrom);
    const to = useStore(state => state.shoppingTo);

    const { data, isLoading, isError, refetch } = useGetShoppingList(from, to);
    const togglePurchased = useTogglePurchased();
    const togglePlanImport = useTogglePlanImport();
    const removeItem = useRemoveShoppingItem();

    const handleToggleItem = useCallback(
        (item: ShoppingItem) => {
            if (togglePurchased.isPending) return;
            togglePurchased.mutate(
                { origin: item.origin, productId: item.productId, purchased: item.purchased },
                { onError: () => ToastService.error(t('common:states.error')) },
            );
        },
        [t, togglePurchased],
    );

    /**
     * Прибрати рядок, доданий руками.
     *
     * Рядок з плану свого рядка не має — він зникає разом зі стравою, і
     * сервер відповів би 404, — тож свайп дається лише ручним.
     */
    const handleRemoveItem = useCallback(
        (item: ShoppingItem) => {
            if (removeItem.isPending) return;
            removeItem.mutate(item.productId, {
                onSuccess: () => ToastService.success(t('shopping:list.removed')),
                onError: () => ToastService.error(t('common:states.error')),
            });
        },
        [removeItem, t],
    );

    const handleSwitchAddFromPlan = useCallback(
        (enabled: boolean) => {
            if (togglePlanImport.isPending) return;
            togglePlanImport.mutate(enabled, {
                onError: () => ToastService.error(t('common:states.error')),
            });
        },
        [t, togglePlanImport],
    );

    // Групи вже приходять у порядку полиць, порожні сервер не шле — власного
    // сортування тут немає навмисно, інакше воно розійшлось би з лічильником
    // на вкладці, який теж рахує сервер.
    const groups = data?.groups ?? [];

    return {
        groups,
        isLoading,
        isError,
        handleRetry: refetch,
        isEmpty: !isLoading && !isError && groups.length === 0,
        addFromPlan: data?.importFromPlan ?? true,
        switchAddFromPlan: handleSwitchAddFromPlan,
        toggleShoppingItem: handleToggleItem,
        removeShoppingItem: handleRemoveItem,
        handleAddProduct: () => router.push('/(app)/add-product'),
    };
};
