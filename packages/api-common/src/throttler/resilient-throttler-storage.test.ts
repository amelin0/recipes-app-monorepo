import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';

import { ResilientThrottlerStorage } from './resilient-throttler-storage';

const record = (over: Partial<ThrottlerStorageRecord> = {}): ThrottlerStorageRecord => ({
    totalHits: 3,
    timeToExpire: 42,
    isBlocked: false,
    timeToBlockExpire: 0,
    ...over,
});

const workingStore = (result = record()): ThrottlerStorage => ({
    increment: async () => result,
});

const brokenStore = (): ThrottlerStorage => ({
    increment: async () => {
        throw new Error('connection refused');
    },
});

test('passes the store’s answer through untouched', async () => {
    const answer = record({ totalHits: 11, isBlocked: true, timeToBlockExpire: 90 });
    const storage = new ResilientThrottlerStorage(workingStore(answer));

    assert.deepEqual(await storage.increment('key', 60, 10, 0, 'default'), answer);
});

/**
 * The whole point of the wrapper. A rate limiter is a protection, not a
 * correctness rule — but if its store's failure propagated, an unreachable
 * Redis would turn every request, sign-in included, into a 500.
 */
test('lets the request through when the store is unreachable', async () => {
    const storage = new ResilientThrottlerStorage(brokenStore());

    const result = await storage.increment('key', 60, 10, 0, 'default');

    assert.equal(result.isBlocked, false, 'a broken store must not block anybody');
    assert.equal(result.totalHits, 1);
});

/** The window the caller would have had — so response headers stay sensible. */
test('reports the requested ttl rather than zero while failing open', async () => {
    const storage = new ResilientThrottlerStorage(brokenStore());

    const result = await storage.increment('key', 60, 10, 0, 'default');

    assert.equal(result.timeToExpire, 60);
});

/**
 * A store that is down is down for every request. One line per request would
 * bury the message that explains the others — and fill the disk Postgres
 * shares while doing it.
 */
test('complains about an unreachable store at most once a minute', async () => {
    const logged: unknown[] = [];
    const storage = new ResilientThrottlerStorage(brokenStore());

    // The logger is private on purpose; this replaces just its sink.
    (storage as unknown as { logger: { error: (payload: unknown) => void } }).logger = {
        error: payload => logged.push(payload),
    };

    for (let i = 0; i < 5; i++) {
        await storage.increment('key', 60, 10, 0, 'default');
    }

    assert.equal(logged.length, 1, 'five failures, one complaint');
});
