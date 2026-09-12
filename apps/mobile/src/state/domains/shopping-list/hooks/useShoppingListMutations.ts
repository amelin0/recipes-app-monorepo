import { useMutation } from '@tanstack/react-query';

import { ShoppingListApi, type AddShoppingItemPayload, type ShoppingItemOrigin } from '@/data';
import { queryClient, Queries } from '@/shared/services';

/** Every window of the list is a different sum of the same data — refresh them all. */
const invalidateList = () => {
    queryClient.invalidateQueries({ queryKey: [Queries.ShoppingList] });
};

export const useAddShoppingItem = () =>
    useMutation({
        mutationFn: (payload: AddShoppingItemPayload) => ShoppingListApi.addItem(payload),
        onSuccess: invalidateList,
    });

/** Manual lines only; an imported one goes away with the dish that put it there. */
export const useRemoveShoppingItem = () =>
    useMutation({
        mutationFn: (productId: string) => ShoppingListApi.removeItem(productId),
        onSuccess: invalidateList,
    });

interface PurchasedVariables {
    origin: ShoppingItemOrigin;
    productId: string;
    /** The state the row is in now; the call flips it. */
    purchased: boolean;
}

/**
 * The tick. Not optimistic: crossing a line out also moves it to the bottom
 * of its group and changes the tab badge, and reproducing that ordering on
 * the client would be a second implementation of the server's sort.
 */
export const useTogglePurchased = () =>
    useMutation({
        mutationFn: ({ origin, productId, purchased }: PurchasedVariables) =>
            purchased
                ? ShoppingListApi.unmarkPurchased(origin, productId)
                : ShoppingListApi.markPurchased(origin, productId),
        onSuccess: invalidateList,
    });

export const useClearShoppingList = () =>
    useMutation({
        mutationFn: () => ShoppingListApi.clear(),
        onSuccess: invalidateList,
    });

/** «Додати з плану» — a state, not an action on any one dish. */
export const useTogglePlanImport = () =>
    useMutation({
        mutationFn: (enabled: boolean) =>
            enabled ? ShoppingListApi.enablePlanImport() : ShoppingListApi.disablePlanImport(),
        onSuccess: () => {
            invalidateList();
            // Дні плану несуть прапорець `importsIntoShoppingList` — він щойно
            // змінився для всіх.
            queryClient.invalidateQueries({ queryKey: [Queries.MealPlan] });
        },
    });
