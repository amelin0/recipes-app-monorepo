/**
 * Who put a row in the catalog.
 *
 * One enum for products and recipes alike, because it is one question: shipped
 * by us, or made by the person looking at it. A per-table copy would let the
 * two drift apart while meaning the same thing.
 */
export enum ContentSource {
    Global = 'global',
    Custom = 'custom',
}

/** The three cuts of the same collection the catalog tab offers (recipes-list FR-001). */
export enum RecipeTab {
    All = 'all',
    Favorite = 'favorite',
    Own = 'own',
}

/**
 * How a line got onto the shopping list.
 *
 * A manual line is a stored row; a plan line is a sum over the meal plan,
 * computed fresh on every read. The distinction is visible to the client
 * because only one of them can be deleted, and because the same product may
 * stand on the list once as each.
 */
export enum ShoppingItemOrigin {
    Manual = 'manual',
    Plan = 'plan',
}

/** How a quantity is entered before the server converts it to grams (add-product FR-005). */
export enum ShoppingUnit {
    Serving = 'serving',
    Piece = 'piece',
    Gram = 'gram',
}
