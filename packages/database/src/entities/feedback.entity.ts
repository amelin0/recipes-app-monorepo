import { FeedbackStatus, FeedbackType } from '@dns/shared-types';

import { feedback } from '../schema';

type FeedbackRow = typeof feedback.$inferSelect;

export class FeedbackEntity {
    readonly id: string;
    readonly userId: string | null;
    readonly type: FeedbackType;
    readonly status: FeedbackStatus;
    readonly description: string;
    readonly imageUrls: string[];
    readonly replyEmail: string | null;
    readonly createdAt: Date;

    private constructor(row: FeedbackRow) {
        this.id = row.id;
        this.userId = row.userId;
        this.type = row.type as FeedbackType;
        this.status = row.status as FeedbackStatus;
        this.description = row.description;
        this.imageUrls = row.imageUrls;
        this.replyEmail = row.replyEmail;
        this.createdAt = row.createdAt;
    }

    static from(row: FeedbackRow): FeedbackEntity {
        return new FeedbackEntity(row);
    }
}
