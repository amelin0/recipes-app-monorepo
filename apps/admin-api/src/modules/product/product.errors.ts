/** Stable machine-readable reasons travelling in `ApiError.code`. */
export const ProductErrorCode = {
    NotFound: 'product.not-found',
    UnknownGroup: 'product.unknown-group',
    DuplicateName: 'product.duplicate-name',
    BadImportFile: 'product.bad-import-file',
} as const;

export type ProductErrorCode = (typeof ProductErrorCode)[keyof typeof ProductErrorCode];
