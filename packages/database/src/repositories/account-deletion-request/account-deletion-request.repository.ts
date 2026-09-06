import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';

import { AccountDeletionRequestEntity } from '../../entities';
import { accountDeletionRequests } from '../../schema';
import { BaseRepository } from '../base.repository';

@Injectable()
export class AccountDeletionRequestRepository extends BaseRepository {
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
