// Transport contract shared by both APIs and every client.
// `ResponseInterceptor` produces these shapes; `GlobalExceptionFilter`
// produces `ApiError`. Nothing here is domain-specific.

/**
 * Every successful response is wrapped: the payload never sits at the root.
 * Clients unwrap once (`apps/mobile` does it in `HttpService`), so adding a
 * top-level field later never collides with a domain field name.
 */
export interface ApiResponse<T> {
    data: T;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PaginationQuery {
    page?: number;
    limit?: number;
    sort?: string;
    order?: SortOrder;
}

export type SortOrder = 'asc' | 'desc';

export interface ApiError {
    statusCode: number;
    message: string;
    /**
     * Stable machine-readable reason, e.g. `auth.code-expired`. Optional and
     * additive: without it, two different 429s — a throttled login and an
     * exhausted code-resend budget — are indistinguishable on the client, so
     * the mobile app has no way to pick the right message.
     */
    code?: string;
    /** Field-level detail; populated for 422 validation failures. */
    errors?: ApiFieldError[];
}

export interface ApiFieldError {
    path: string;
    message: string;
}
