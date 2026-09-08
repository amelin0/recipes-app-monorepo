import { Injectable, Logger } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';

/**
 * Wraps a rate-limit store so that losing it cannot take the API down.
 *
 * **Fail-open, deliberately.** Rate limiting is a protection, not a
 * correctness rule: nothing in the product is wrong if a request goes through
 * uncounted. But if the store's failure propagated, an unreachable Redis would
 * turn every request — sign-in included — into a 500. That trades a small,
 * temporary loss of protection for a total outage, which is the wrong way
 * round.
 *
 * The cost is stated rather than hidden: while the store is down there is no
 * limit at all, and that is why the fallback is logged as an error rather than
 * swallowed.
 */
@Injectable()
export class ResilientThrottlerStorage implements ThrottlerStorage {
    private readonly logger = new Logger(ResilientThrottlerStorage.name);

    /**
     * Logged once a minute at most.
     *
     * A store that is down is down for every request, and a line per request
     * would bury the very message that explains the others — on a busy minute
     * it is also the fastest way to fill the disk that Postgres shares.
     */
    private lastComplaintAt = 0;

    constructor(private readonly inner: ThrottlerStorage) {}

    async increment(
        key: string,
        ttl: number,
        limit: number,
        blockDuration: number,
        throttlerName: string,
    ): Promise<ThrottlerStorageRecord> {
        try {
            return await this.inner.increment(key, ttl, limit, blockDuration, throttlerName);
        } catch (error) {
            this.complain(error);

            // One hit, never blocked: the request proceeds and the guard has
            // nothing to act on. `timeToExpire` is the window the caller would
            // have had, so response headers stay sane rather than reading zero.
            return { totalHits: 1, timeToExpire: ttl, isBlocked: false, timeToBlockExpire: 0 };
        }
    }

    private complain(error: unknown): void {
        const now = Date.now();
        if (now - this.lastComplaintAt < 60_000) return;

        this.lastComplaintAt = now;
        this.logger.error({
            msg: 'rate-limit store is unavailable — requests are passing UNLIMITED',
            error,
        });
    }
}
