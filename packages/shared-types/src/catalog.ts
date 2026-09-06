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
