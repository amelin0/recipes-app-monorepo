import { Module } from '@nestjs/common';

import { NotificationsProducerModule } from '@dns/api-common';
import { ProfileRepositoryModule, SubscriptionRepositoryModule } from '@dns/database';

import { AuthModule } from '../auth';
import { CatalogModule } from '../catalog';

import { ReferralController } from './referral.controller';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

@Module({
    imports: [
        AuthModule,
        CatalogModule,
        SubscriptionRepositoryModule,
        ProfileRepositoryModule,
        NotificationsProducerModule,
    ],
    controllers: [SubscriptionController, ReferralController],
    providers: [SubscriptionService],
})
export class SubscriptionModule {}
