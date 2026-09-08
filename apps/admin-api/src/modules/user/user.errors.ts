/** Stable machine-readable reasons travelling in `ApiError.code`. */
export const UserErrorCode = {
    NotFound: 'user.not-found',
    NoDeletionRequest: 'user.no-deletion-request',
} as const;

export type UserErrorCode = (typeof UserErrorCode)[keyof typeof UserErrorCode];
