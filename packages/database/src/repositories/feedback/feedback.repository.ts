import { Injectable } from '@nestjs/common';

import { FeedbackEntity } from '../../entities';
import { feedback } from '../../schema';
import { BaseRepository } from '../base.repository';

type InsertFeedback = typeof feedback.$inferInsert;

@Injectable()
export class FeedbackRepository extends BaseRepository {
    async create(data: InsertFeedback): Promise<FeedbackEntity> {
        const [row] = await this.db.insert(feedback).values(data).returning();
        if (!row) throw new Error('Failed to insert feedback');
        return FeedbackEntity.from(row);
    }
}
