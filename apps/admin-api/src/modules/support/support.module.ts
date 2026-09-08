import { Module } from '@nestjs/common';

import { AdminFeedbackRepositoryModule } from '@dns/database';

import { SupportController } from './support.controller';
import { SupportService } from './support.service';

/**
 * No mailer, no notification service — nothing in this module can reach the
 * person who raised a ticket (support-inbox FR-011). That is enforced by the
 * dependency list rather than by a convention someone has to remember.
 */
@Module({
    imports: [AdminFeedbackRepositoryModule],
    controllers: [SupportController],
    providers: [SupportService],
    exports: [SupportService],
})
export class SupportModule {}
