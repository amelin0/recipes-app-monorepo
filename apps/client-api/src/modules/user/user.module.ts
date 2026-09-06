import { Module } from '@nestjs/common';

import {
    AccountDeletionRequestRepositoryModule,
    FeedbackRepositoryModule,
    ProfileRepositoryModule,
    UserReminderRepositoryModule,
    UserSettingsRepositoryModule,
} from '@dns/database';

import { AuthModule } from '../auth';

import { AccountDeletionController } from './account-deletion.controller';
import { AccountDeletionService } from './account-deletion.service';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';

@Module({
    imports: [
        AuthModule,
        ProfileRepositoryModule,
        UserSettingsRepositoryModule,
        UserReminderRepositoryModule,
        AccountDeletionRequestRepositoryModule,
        FeedbackRepositoryModule,
    ],
    controllers: [ProfileController, RemindersController, AccountDeletionController, FeedbackController],
    providers: [ProfileService, RemindersService, AccountDeletionService, FeedbackService],
})
export class UserModule {}
