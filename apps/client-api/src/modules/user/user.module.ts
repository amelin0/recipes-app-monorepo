import { Module } from '@nestjs/common';

import { ProfileRepositoryModule, UserReminderRepositoryModule, UserSettingsRepositoryModule } from '@dns/database';

import { AuthModule } from '../auth';

import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';

@Module({
    imports: [AuthModule, ProfileRepositoryModule, UserSettingsRepositoryModule, UserReminderRepositoryModule],
    controllers: [ProfileController, RemindersController],
    providers: [ProfileService, RemindersService],
})
export class UserModule {}
