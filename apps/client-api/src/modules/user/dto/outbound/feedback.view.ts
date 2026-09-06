import { ApiProperty } from '@nestjs/swagger';

import { FeedbackEntity } from '@dns/database';
import { FeedbackStatus, FeedbackType } from '@dns/shared-types';

/**
 * The receipt the confirmation screen shows (FR-007). Deliberately thin: the
 * reporter does not need their own text handed back, only proof it landed.
 */
export class FeedbackView {
    @ApiProperty({ format: 'uuid' })
    readonly id: string;

    @ApiProperty({ enum: FeedbackType })
    readonly type: FeedbackType;

    @ApiProperty({ enum: FeedbackStatus })
    readonly status: FeedbackStatus;

    @ApiProperty()
    readonly createdAt: string;

    private constructor(entity: FeedbackEntity) {
        this.id = entity.id;
        this.type = entity.type;
        this.status = entity.status;
        this.createdAt = entity.createdAt.toISOString();
    }

    static from(entity: FeedbackEntity): FeedbackView {
        return new FeedbackView(entity);
    }
}
