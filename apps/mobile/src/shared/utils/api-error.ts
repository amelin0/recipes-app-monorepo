/**
 * The API's error body, as `HttpService` rejects it.
 *
 * Errors are NOT wrapped in the `{ data }` envelope that successes carry, so
 * what a call site catches is this object verbatim. `code` is the stable
 * machine-readable name (`auth.email-not-verified`); `message` is English
 * prose meant for logs, never for the screen.
 */
export interface ApiError {
    statusCode?: number;
    code?: string;
    message?: string;
    /** Present on 422 only — one entry per rejected field. */
    errors?: { path: string; message: string }[];
}

export const toApiError = (error: unknown): ApiError => (error ?? {}) as ApiError;

export const apiErrorCode = (error: unknown): string | undefined => toApiError(error).code;

export const apiErrorStatus = (error: unknown): number | undefined => toApiError(error).statusCode;

/**
 * Field errors from a 422, keyed by field name.
 *
 * The client validates the same rules before sending, so a 422 usually means
 * the two validators disagree — surfacing the field rather than a generic
 * toast is what makes that visible instead of mysterious.
 */
export const apiFieldErrors = (error: unknown): Record<string, string> => {
    const entries = toApiError(error).errors ?? [];
    return entries.reduce<Record<string, string>>((acc, item) => {
        if (item.path && !acc[item.path]) acc[item.path] = item.message;
        return acc;
    }, {});
};
