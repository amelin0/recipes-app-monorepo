/**
 * Stable machine-readable reasons for the storage checks, carried in
 * `ApiError.code`.
 *
 * They live here and not in the calling module's `*.errors.ts` because the
 * fact they name belongs to the store, not to a domain: the profile photo, a
 * support attachment and a dish photo all fail the same way, and a client that
 * retries the upload should not have to learn one code per screen.
 */
export const StorageErrorCode = {
    /**
     * The URL is one this user was granted, but nothing was ever PUT to it —
     * the upload failed, was abandoned, or has not finished. Unlike the
     * ownership failures this one is recoverable: upload again, then retry.
     */
    NotUploaded: 'storage.file-not-uploaded',
} as const;

export type StorageErrorCode = (typeof StorageErrorCode)[keyof typeof StorageErrorCode];
