import { useMutation } from '@tanstack/react-query';

import { ShoppingListApi, type AddShoppingItemPayload, type ShoppingItemOrigin, type ShoppingList } from '@/data';
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

/** Flips one row in every cached window of the list. */
const flipPurchased = (list: ShoppingList, origin: ShoppingItemOrigin, productId: string): ShoppingList => ({
    ...list,
    groups: list.groups.map(group => ({
        ...group,
        items: group.items.map(item =>
            item.origin === origin && item.productId === productId ? { ...item, purchased: !item.purchased } : item,
        ),
    })),
});

/**
 * The tick, applied to the cache first and confirmed by the server after.
 *
 * It used to wait for the round trip, on the grounds that the server also
 * reorders the row and changes the tab badge — reproducing that here would be
 * a second implementation of its sort. Checked against the stand: neither
 * happens. A ticked row keeps its place and `visibleCount` counts ticked rows
 * too, so the only thing that changes is the tick itself, and the client can
 * draw that.
 *
 * The wait was the whole problem: on a sleeping connection the request sat in
 * axios' 30-second timeout while the row stayed exactly as it was — no tick,
 * no spinner, nothing to say the tap had registered.
 */
export const useTogglePurchased = () =>
    useMutation({
        mutationFn: ({ origin, productId, purchased }: PurchasedVariables) =>
            purchased
                ? ShoppingListApi.unmarkPurchased(origin, productId)
                : ShoppingListApi.markPurchased(origin, productId),

        onMutate: async ({ origin, productId }: PurchasedVariables) => {
            // Скасовуємо читання в польоті: інакше відповідь, що вже летить,
            // перетре щойно намальовану галочку старим станом.
            await queryClient.cancelQueries({ queryKey: [Queries.ShoppingList] });

            const snapshot = queryClient.getQueriesData<ShoppingList>({ queryKey: [Queries.ShoppingList] });
            queryClient.setQueriesData<ShoppingList>({ queryKey: [Queries.ShoppingList] }, list =>
                list ? flipPurchased(list, origin, productId) : list,
            );

            return { snapshot };
        },

        // Не вдалося — повертаємо рядок як був, щоб екран не стверджував
        // купленого, якого сервер не бачив.
        onError: (_error, _variables, context) => {
            context?.snapshot.forEach(([key, list]) => queryClient.setQueryData(key, list));
        },

        // Звіряємось із сервером у будь-якому разі: він рахує лічильник вкладки.
        onSettled: invalidateList,
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
