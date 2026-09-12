/**
 * Codes any route of either API can answer with, as opposed to a domain's own
 * (`auth.*`, `user.*`, …). Travels in `ApiError.code`.
 */
export const CommonErrorCode = {
    /**
     * 409: the request lost a race with another one — the row it would have
     * created already exists, or a row it points at is gone or still in use.
     * Nothing about the input was wrong, and repeating the request usually
     * resolves it.
     */
    Conflict: 'common.conflict',
} as const;

export type CommonErrorCode = (typeof CommonErrorCode)[keyof typeof CommonErrorCode];
