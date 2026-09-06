export const CatalogErrorCode = {
    RecipeNotFound: 'catalog.recipe-not-found',
    ProductNotFound: 'catalog.product-not-found',
    UnknownProductGroup: 'catalog.unknown-product-group',
} as const;

export type CatalogErrorCodeValue = (typeof CatalogErrorCode)[keyof typeof CatalogErrorCode];
