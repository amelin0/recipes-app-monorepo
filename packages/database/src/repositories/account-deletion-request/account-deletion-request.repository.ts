import { Injectable } from '@nestjs/common';
import { and, count, eq, gt, isNull, lte, min } from 'drizzle-orm';

import { AccountDeletionRequestEntity } from '../../entities';
import { accountDeletionRequests } from '../../schema';
import { BaseRepository } from '../base.repository';

/** How many requests are still open, split by whether their moment has come. */
export interface OpenDeletionRequestCounts {
    /** Grace period is over and nothing has been erased — someone owes work. */
    overdue: number;
    /** Still counting down; the user can still take it back. */
    waiting: number;
    /**
     * When the longest-waiting overdue request was due, or `null` if none are.
     *
     * The count alone cannot carry an alert: the procedure that clears these is
     * manual and weekly, so «more than zero» is the normal state between runs.
     * How long the oldest one has been waiting is the thing that separates
     * «Tuesday» from «nobody has run it in a month».
     */
    oldestOverdueAt: Date | null;
}

@Injectable()
export class AccountDeletionRequestRepository extends BaseRepository {
    /**
     * Counts the open requests on both sides of `now`.
     *
     * Exists for the monitoring gauge rather than for a feature: nothing in the
     * product erases an account yet, so overdue requests pile up silently, and
     * «silently» is the problem — the promise made to the user has a date on it.
     */
    async countOpen(now: Date = new Date()): Promise<OpenDeletionRequestCounts> {
        const open = and(isNull(accountDeletionRequests.cancelledAt), isNull(accountDeletionRequests.executedAt));

        const [overdue] = await this.db
            .select({ value: count() })
            .from(accountDeletionRequests)
            .where(and(open, lte(accountDeletionRequests.scheduledFor, now)));

        const [waiting] = await this.db
            .select({ value: count() })
            .from(accountDeletionRequests)
            .where(and(open, gt(accountDeletionRequests.scheduledFor, now)));

        const [oldest] = await this.db
            .select({ value: min(accountDeletionRequests.scheduledFor) })
            .from(accountDeletionRequests)
            .where(and(open, lte(accountDeletionRequests.scheduledFor, now)));

        return {
            overdue: overdue?.value ?? 0,
            waiting: waiting?.value ?? 0,
            // Drizzle types `min` over a timestamp column as a string here.
            oldestOverdueAt: oldest?.value ? new Date(oldest.value) : null,
        };
    }

    /** The one request still counting down, if any. */
    async findActive(userId: string): Promise<AccountDeletionRequestEntity | null> {
        const row = await this.db.query.accountDeletionRequests.findFirst({
            where: and(
                eq(accountDeletionRequests.userId, userId),
                isNull(accountDeletionRequests.cancelledAt),
                isNull(accountDeletionRequests.executedAt),
            ),
        });

        return row ? AccountDeletionRequestEntity.from(row) : null;
    }

    async create(userId: string, scheduledFor: Date): Promise<AccountDeletionRequestEntity> {
        const [row] = await this.db.insert(accountDeletionRequests).values({ userId, scheduledFor }).returning();
        if (!row) throw new Error('Failed to insert account deletion request');
        return AccountDeletionRequestEntity.from(row);
    }

    async cancel(id: string): Promise<void> {
        await this.db
            .update(accountDeletionRequests)
            .set({ cancelledAt: new Date() })
            .where(eq(accountDeletionRequests.id, id));
    }
}
