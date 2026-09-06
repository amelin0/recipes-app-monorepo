import { Module } from '@nestjs/common';

import {
    AccountDeletionRequestRepositoryModule,
    ProfileRepositoryModule,
    UserReminderRepositoryModule,
    UserSettingsRepositoryModule,
} from '@dns/database';

import { AuthModule } from '../auth';

import { AccountDeletionController } from './account-deletion.controller';
import { AccountDeletionService } from './account-deletion.service';
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
    ],
    controllers: [ProfileController, RemindersController, AccountDeletionController],
    providers: [ProfileService, RemindersService, AccountDeletionService],
})
export class UserModule {}
