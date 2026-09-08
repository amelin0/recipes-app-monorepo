/** Stable machine-readable reasons travelling in `ApiError.code`. */
export const SupportErrorCode = {
    NotFound: 'support.not-found',
} as const;

export type SupportErrorCode = (typeof SupportErrorCode)[keyof typeof SupportErrorCode];
