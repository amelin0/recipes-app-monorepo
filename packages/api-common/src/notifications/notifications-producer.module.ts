import { Module } from '@nestjs/common';

import { NotificationRepositoryModule, UserSettingsRepositoryModule } from '@dns/database';

import { NotificationsProducer } from './notifications-producer.service';

@Module({
    imports: [NotificationRepositoryModule, UserSettingsRepositoryModule],
    providers: [NotificationsProducer],
    exports: [NotificationsProducer],
})
export class NotificationsProducerModule {}
