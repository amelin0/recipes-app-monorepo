/** Stable machine-readable reasons travelling in `ApiError.code`. */
export const RecipeErrorCode = {
    NotFound: 'recipe.not-found',
    UnknownProduct: 'recipe.unknown-product',
    DuplicateImportKey: 'recipe.duplicate-import-key',
    RecipeInUse: 'recipe.in-use',
    BadImportFile: 'recipe.bad-import-file',
} as const;

export type RecipeErrorCode = (typeof RecipeErrorCode)[keyof typeof RecipeErrorCode];
