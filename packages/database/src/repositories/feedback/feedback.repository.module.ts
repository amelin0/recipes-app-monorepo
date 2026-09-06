import { Module } from '@nestjs/common';

import { FeedbackRepository } from './feedback.repository';

@Module({
    providers: [FeedbackRepository],
    exports: [FeedbackRepository],
})
export class FeedbackRepositoryModule {}
