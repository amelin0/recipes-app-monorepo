import { Module } from '@nestjs/common';

import { AdminFeedbackRepository } from './admin-feedback.repository';

@Module({
    providers: [AdminFeedbackRepository],
    exports: [AdminFeedbackRepository],
})
export class AdminFeedbackRepositoryModule {}
