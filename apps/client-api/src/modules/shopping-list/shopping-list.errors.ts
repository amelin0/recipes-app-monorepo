export const ShoppingListErrorCode = {
    /** The product being added does not exist, or belongs to somebody else. */
    ProductNotFound: 'shopping-list.product-not-found',
    /**
     * Nothing of this account's own to remove. An imported line answers the
     * same way: it has no row, it is a sum over the plan.
     */
    ItemNotFound: 'shopping-list.item-not-found',
} as const;
