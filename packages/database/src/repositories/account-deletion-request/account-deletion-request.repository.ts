import { Injectable } from '@nestjs/common';
import { SQL, and, count, eq, gt, isNull, lte, min } from 'drizzle-orm';

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
        const open = this.isActive();

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

    /**
     * The one request still counting down, if any. «One» is the partial unique
     * index `account_deletion_requests_one_active_per_user`, not a hope.
     */
    async findActive(userId: string): Promise<AccountDeletionRequestEntity | null> {
        const row = await this.db.query.accountDeletionRequests.findFirst({
            where: and(eq(accountDeletionRequests.userId, userId), this.isActive()),
        });

        return row ? AccountDeletionRequestEntity.from(row) : null;
    }

    /**
     * Raises a request, or returns null when one is already counting down.
     *
     * One statement and no prior read: the partial unique index is what says
     * «already pending», so two taps in flight cannot both get past it. The
     * second insert waits for the first to commit and then does nothing.
     *
     * `ON CONFLICT DO NOTHING` without a target on purpose — the only other
     * unique constraint on the table is the random primary key, and naming the
     * partial index here would repeat its predicate in a second place.
     */
    async createIfNoneActive(userId: string, scheduledFor: Date): Promise<AccountDeletionRequestEntity | null> {
        const [row] = await this.db
            .insert(accountDeletionRequests)
            .values({ userId, scheduledFor })
            .onConflictDoNothing()
            .returning();

        return row ? AccountDeletionRequestEntity.from(row) : null;
    }

    /**
     * Cancels whatever is counting down for the account, in one conditional
     * update, and says whether anything was.
     *
     * By owner rather than by the id of a row read a moment earlier: with a
     * read first, a concurrent second cancel would stamp the same row twice and
     * both callers would report success. Here the second one waits on the row
     * lock, re-checks `cancelled_at is null`, finds nothing and returns false.
     * Addresses every active row rather than one picked by id, so the
     * statement stays correct on its own and does not lean on the index to
     * mean «the» request.
     */
    async cancelActive(userId: string): Promise<boolean> {
        const cancelled = await this.db
            .update(accountDeletionRequests)
            .set({ cancelledAt: new Date() })
            .where(and(eq(accountDeletionRequests.userId, userId), this.isActive()))
            .returning({ id: accountDeletionRequests.id });

        return cancelled.length > 0;
    }

    /** Active means neither cancelled nor executed — state is derived, never stored. */
    private isActive(): SQL {
        const active = and(isNull(accountDeletionRequests.cancelledAt), isNull(accountDeletionRequests.executedAt));
        if (!active) throw new Error('Failed to build the deletion-request clause');
        return active;
    }
}
