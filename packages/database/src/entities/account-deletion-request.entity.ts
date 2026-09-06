import { AccountDeletionState } from '@dns/shared-types';

import { accountDeletionRequests } from '../schema';

type AccountDeletionRequestRow = typeof accountDeletionRequests.$inferSelect;

export class AccountDeletionRequestEntity {
    readonly id: string;
    readonly userId: string;
    readonly scheduledFor: Date;
    readonly cancelledAt: Date | null;
    readonly executedAt: Date | null;
    readonly createdAt: Date;

    private constructor(row: AccountDeletionRequestRow) {
        this.id = row.id;
        this.userId = row.userId;
        this.scheduledFor = row.scheduledFor;
        this.cancelledAt = row.cancelledAt;
        this.executedAt = row.executedAt;
        this.createdAt = row.createdAt;
    }

    static from(row: AccountDeletionRequestRow): AccountDeletionRequestEntity {
        return new AccountDeletionRequestEntity(row);
    }

    /** Derived from the timestamps — the row stores no state column to disagree with. */
    state(): AccountDeletionState {
        if (this.executedAt) return AccountDeletionState.Executed;
        if (this.cancelledAt) return AccountDeletionState.Cancelled;
        return AccountDeletionState.Active;
    }

    isActive(): boolean {
        return this.state() === AccountDeletionState.Active;
    }
}
