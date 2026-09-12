import assert from 'node:assert/strict';
import { test } from 'node:test';

import { NotificationRepository, UserSettingsRepository } from '@dns/database';
import { NotificationEvent } from '@dns/shared-types';

import { NotificationDedupeKey } from './notification-dedupe-key';
import { NotificationsProducer } from './notifications-producer.service';

type Written = Parameters<NotificationRepository['createUnlessDuplicate']>[0];

/**
 * An inbox that behaves like the unique index: a second row under a key the
 * account already has is not written. The real thing is proven against
 * Postgres in the client db-spec; this pins what the producer does with it.
 */
function fakeInbox(options: { fail?: boolean } = {}): { repository: NotificationRepository; rows: Written[] } {
    const rows: Written[] = [];

    const repository = {
        createUnlessDuplicate: async (data: Written) => {
            if (options.fail) throw new Error('inbox is down');

            const duplicate =
                data.dedupeKey != null &&
                rows.some(row => row.userId === data.userId && row.dedupeKey === data.dedupeKey);
            if (duplicate) return null;

            rows.push(data);
            return { id: String(rows.length) };
        },
    } as unknown as NotificationRepository;

    return { repository, rows };
}

const settings = {
    findByUserId: async () => ({ language: 'en' }),
} as unknown as UserSettingsRepository;

test('passes the key through and reports the row as written', async () => {
    const inbox = fakeInbox();
    const producer = new NotificationsProducer(inbox.repository, settings);

    const written = await producer.emit('user-1', NotificationEvent.SubscriptionExpired, {
        date: new Date('2026-10-12T00:00:00Z'),
        dedupeKey: NotificationDedupeKey.subscriptionExpired('sub-1'),
    });

    assert.equal(written, true);
    assert.equal(inbox.rows[0]?.dedupeKey, 'sub-expired:sub-1');
});

test('reports a duplicate as not written, and does not throw', async () => {
    const inbox = fakeInbox();
    const producer = new NotificationsProducer(inbox.repository, settings);
    const input = { subject: 'Cheese', dedupeKey: NotificationDedupeKey.productVerified('product-1') };

    assert.equal(await producer.emit('user-1', NotificationEvent.ProductVerified, input), true);
    assert.equal(await producer.emit('user-1', NotificationEvent.ProductVerified, input), false);
    assert.equal(inbox.rows.length, 1);
});

test('writes a keyless event every time', async () => {
    const inbox = fakeInbox();
    const producer = new NotificationsProducer(inbox.repository, settings);

    await producer.emit('user-1', NotificationEvent.AccountDeletionCancelled);
    await producer.emit('user-1', NotificationEvent.AccountDeletionCancelled);

    assert.equal(inbox.rows.length, 2);
    assert.equal(inbox.rows[0]?.dedupeKey, null);
});

/** Still a side effect: a failed write is «not written», never an exception. */
test('swallows a failing inbox and says nothing was written', async () => {
    const producer = new NotificationsProducer(fakeInbox({ fail: true }).repository, settings);

    assert.equal(await producer.emit('user-1', NotificationEvent.AccountDeletionCancelled), false);
});

/**
 * The expiring key carries the date because a referral reward moves a live
 * subscription's end without changing its id — the new date must be warned
 * about too.
 */
test('keys a warning by subscription and end date, not by subscription alone', () => {
    const first = NotificationDedupeKey.subscriptionExpiring('sub-1', new Date('2026-10-12T00:00:00Z'));
    const extended = NotificationDedupeKey.subscriptionExpiring('sub-1', new Date('2026-11-12T00:00:00Z'));

    assert.notEqual(first, extended);
    assert.equal(first, 'sub-expiring:sub-1:2026-10-12T00:00:00.000Z');
});
