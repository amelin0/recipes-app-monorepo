import { useCallback } from 'react';

import { router } from 'expo-router';

import type { ShoppingItem } from '@/data';
import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';
import { useGetShoppingList, useTogglePlanImport, useTogglePurchased } from '@/state/domains/shopping-list';

export const useShoppingListScreen = () => {
    const { t } = useAppTranslation(['shopping', 'common']);

    const from = useStore(state => state.shoppingFrom);
    const to = useStore(state => state.shoppingTo);

    const { data, isLoading, isError, refetch } = useGetShoppingList(from, to);
    const togglePurchased = useTogglePurchased();
    const togglePlanImport = useTogglePlanImport();

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
        handleAddProduct: () => router.push('/(app)/add-product'),
    };
};
