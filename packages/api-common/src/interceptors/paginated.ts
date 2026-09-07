import { PaginationMeta } from '@dns/shared-types';

/**
 * A page of results, on its way out.
 *
 * `ResponseInterceptor` wraps everything else as `{ data }`; a page needs
 * `{ data, meta }`, which is the `PaginatedResponse` shape both clients already
 * expect. This class is how the interceptor recognises one — a marker rather
 * than a guess at the payload's shape, because a domain object that happens to
 * carry a field called `meta` should not change how it is serialised.
 */
export class Paginated<T> {
    private constructor(
        readonly data: T[],
        readonly meta: PaginationMeta,
    ) {}

    static of<T>(items: T[], total: number, page: number, limit: number): Paginated<T> {
        return new Paginated(items, {
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        });
    }
}
