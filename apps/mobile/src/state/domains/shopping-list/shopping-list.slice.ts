import type { StateCreator } from 'zustand';

import { shiftIsoDay, toIsoDay } from '@/shared/helpers';

/**
 * How many days ahead the list covers.
 *
 * The list is summed from the plan over a range rather than stored, so the
 * window is what decides its contents. A week is what the design's title says
 * («Список — на тиждень»).
 */
export const SHOPPING_WINDOW_DAYS = 6;

/**
 * What the list screen keeps between visits: nothing but the window it reads.
 *
 * The items live on the server — a local copy would need its own rules for
 * what the plan adds and removes, and those rules already exist there.
 */
export interface ShoppingListSlice {
    shoppingFrom: string;
    shoppingTo: string;
    setShoppingWindow: (from: string, to: string) => void;
    resetShoppingList: () => void;
}

const defaultWindow = () => {
    const from = toIsoDay();
    return { shoppingFrom: from, shoppingTo: shiftIsoDay(from, SHOPPING_WINDOW_DAYS) };
};

export const createShoppingListSlice: StateCreator<ShoppingListSlice, [], [], ShoppingListSlice> = set => ({
    ...defaultWindow(),
    setShoppingWindow: (shoppingFrom, shoppingTo) => set(() => ({ shoppingFrom, shoppingTo })),
    resetShoppingList: () => set(() => defaultWindow()),
});
