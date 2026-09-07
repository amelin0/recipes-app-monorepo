import { Module } from '@nestjs/common';

import { NotificationRepository } from './notification.repository';

@Module({
    providers: [NotificationRepository],
    exports: [NotificationRepository],
})
export class NotificationRepositoryModule {}
