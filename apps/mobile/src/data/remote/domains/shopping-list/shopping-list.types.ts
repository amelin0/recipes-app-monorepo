import type { Reference } from '../catalog';

/** A manual line can be removed; an imported one follows the plan. */
export type ShoppingItemOrigin = 'manual' | 'plan';

/** How a quantity was entered. Storage is grams either way. */
export type ShoppingUnit = 'serving' | 'piece' | 'gram';

export interface ShoppingItem {
    productId: string;
    name: string;
    origin: ShoppingItemOrigin;
    /** Grams. Volume waits for products to carry one. */
    amountG: number;
    /** What that weight of this product comes to. */
    calories: number;
    purchased: boolean;
}

export interface ShoppingGroup {
    group: Reference;
    items: ShoppingItem[];
}

export interface ShoppingList {
    /** The «Додати з плану» switch; on by default. */
    importFromPlan: boolean;
    /** In aisle order, empty groups omitted. */
    groups: ShoppingGroup[];
    /** The tab badge — counted server-side so the two never disagree. */
    visibleCount: number;
}

export interface AddShoppingItemPayload {
    productId: string;
    unit: ShoppingUnit;
    value: number;
}
