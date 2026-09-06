/**
 * Stable machine-readable reasons for the user domain, carried in
 * `ApiError.code`. The recovery screen has to explain what went wrong rather
 * than fail silently (account-deletion FR-008), and it cannot do that from an
 * HTTP status alone.
 */
export const UserErrorCode = {
    DeletionAlreadyRequested: 'user.deletion-already-requested',
    NoDeletionRequest: 'user.no-deletion-request',
} as const;

export type UserErrorCode = (typeof UserErrorCode)[keyof typeof UserErrorCode];
