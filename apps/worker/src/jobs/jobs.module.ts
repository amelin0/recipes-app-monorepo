import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { NotificationsProducerModule } from '@dns/api-common';
import {
    AccountDeletionRequestRepositoryModule,
    NotificationRepositoryModule,
    OtpCodeRepositoryModule,
    PasswordResetPermitRepositoryModule,
    RefreshTokenRepositoryModule,
    SubscriptionRepositoryModule,
} from '@dns/database';

import { ExpiredRowsService } from './cleanup/expired-rows.service';
import { JOBS_QUEUE } from './jobs.constants';
import { JobsMetrics } from './jobs.metrics';
import { JobsProcessor } from './jobs.processor';
import { JobsScheduler } from './jobs.scheduler';
import { PendingWorkService } from './pending-work/pending-work.service';
import { SubscriptionExpiryService } from './subscription/subscription-expiry.service';

@Module({
    imports: [
        BullModule.registerQueue({ name: JOBS_QUEUE }),
        RefreshTokenRepositoryModule,
        OtpCodeRepositoryModule,
        PasswordResetPermitRepositoryModule,
        SubscriptionRepositoryModule,
        NotificationRepositoryModule,
        AccountDeletionRequestRepositoryModule,
        NotificationsProducerModule,
    ],
    providers: [
        ExpiredRowsService,
        SubscriptionExpiryService,
        PendingWorkService,
        JobsProcessor,
        JobsScheduler,
        JobsMetrics,
    ],
    exports: [ExpiredRowsService, SubscriptionExpiryService, PendingWorkService, JobsMetrics],
})
export class JobsModule {}
