import { HttpService } from '@/shared/services';

import type { AddShoppingItemPayload, ShoppingItem, ShoppingItemOrigin, ShoppingList } from './shopping-list.types';

const ENDPOINTS = {
    list: '/shopping-list',
    items: '/shopping-list/items',
    item: (productId: string) => `/shopping-list/items/${productId}`,
    purchased: (origin: ShoppingItemOrigin, productId: string) =>
        `/shopping-list/items/${origin}/${productId}/purchased`,
    planImport: '/shopping-list/plan-import',
} as const;

export const ShoppingListApi = {
    /**
     * The list for a range of days — it is summed from the plan on every read
     * rather than stored, so the window is what decides its contents.
     */
    getList: (from: string, to: string) => HttpService.get<ShoppingList>(ENDPOINTS.list, { params: { from, to } }),

    addItem: (payload: AddShoppingItemPayload) => HttpService.post<ShoppingItem>(ENDPOINTS.items, payload),

    /** Manual lines only; an imported one goes away with its dish. */
    removeItem: (productId: string) => HttpService.delete<void>(ENDPOINTS.item(productId)),

    markPurchased: (origin: ShoppingItemOrigin, productId: string) =>
        HttpService.put<void>(ENDPOINTS.purchased(origin, productId)),

    unmarkPurchased: (origin: ShoppingItemOrigin, productId: string) =>
        HttpService.delete<void>(ENDPOINTS.purchased(origin, productId)),

    /** Empties the whole list. */
    clear: () => HttpService.delete<void>(ENDPOINTS.list),

    /** Turns «Додати з плану» on. */
    enablePlanImport: () => HttpService.put<void>(ENDPOINTS.planImport),

    disablePlanImport: () => HttpService.delete<void>(ENDPOINTS.planImport),
};
