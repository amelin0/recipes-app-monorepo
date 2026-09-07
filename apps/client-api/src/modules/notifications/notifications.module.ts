import { Module } from '@nestjs/common';

import { NotificationRepositoryModule } from '@dns/database';

import { AuthModule } from '../auth';

import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
    imports: [AuthModule, NotificationRepositoryModule],
    controllers: [NotificationsController],
    providers: [NotificationsService],
})
export class NotificationsModule {}
