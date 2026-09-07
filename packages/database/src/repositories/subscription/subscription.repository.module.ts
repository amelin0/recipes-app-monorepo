import { Module } from '@nestjs/common';

import { SubscriptionRepository } from './subscription.repository';

@Module({
    providers: [SubscriptionRepository],
    exports: [SubscriptionRepository],
})
export class SubscriptionRepositoryModule {}
