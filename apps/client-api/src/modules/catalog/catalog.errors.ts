export const CatalogErrorCode = {
    RecipeNotFound: 'catalog.recipe-not-found',
    ProductNotFound: 'catalog.product-not-found',
    UnknownProductGroup: 'catalog.unknown-product-group',
    UnknownCuisine: 'catalog.unknown-cuisine',
    /** An ingredient naming a product that does not exist, or belongs to somebody else. */
    UnknownProduct: 'catalog.unknown-product',
    /** A step chip pointing past the end of the dish's own ingredient list. */
    UnknownStepIngredient: 'catalog.unknown-step-ingredient',
} as const;

export type CatalogErrorCodeValue = (typeof CatalogErrorCode)[keyof typeof CatalogErrorCode];
